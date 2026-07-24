import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, ReactNode, createElement } from 'react';
import { ContactStore, type ContactRecord, type TrustProvenance } from '../api/contactStore';
import { STORAGE_POLL_INTERVAL_MS } from '../config';
import { useKeys } from './useKeys';
import { useAuth } from './useAuth';

export interface Contact {
  address: string;
  name: string;
  fingerprint: string;
}

const LEGACY_KEY = 'dmcn_contacts';

function normAddr(a: string): string {
  return a.trim().toLowerCase();
}

function byName(a: Contact, b: Contact): number {
  return (a.name || a.address).localeCompare(b.name || b.address);
}

// recordsSig is a content signature over the fields consumers care about, so a poll
// that returns an equal list doesn't churn `records` identity (which would ripple
// into every consumer — inbox categorization, the open reader's trust badge, etc.).
function recordsSig(list: ContactRecord[]): string {
  return list
    .map(r => `${normAddr(r.address)}|${r.v}|${r.updatedAt}|${r.name}|${r.fingerprint}|${r.provenance ?? ''}|${r.ed25519Pub ?? ''}|${r.x25519Pub ?? ''}`)
    .sort()
    .join('\n');
}

// migrateLegacy imports any device-local (localStorage) contacts into the synced
// store once, then clears them — so upgrading users don't lose their address book.
async function migrateLegacy(store: ContactStore): Promise<void> {
  let saved: Contact[] = [];
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    saved = JSON.parse(raw) as Contact[];
  } catch {
    return;
  }
  if (!Array.isArray(saved) || saved.length === 0) {
    localStorage.removeItem(LEGACY_KEY);
    return;
  }
  try {
    for (const c of saved) {
      await store.put({ address: c.address, name: c.name, fingerprint: c.fingerprint });
    }
    localStorage.removeItem(LEGACY_KEY); // only after all imported
  } catch {
    // leave localStorage in place; retry on a later mount
  }
}

// AllowlistInput is a first-message-approval (or manual) allowlist entry with its
// trust provenance and the sender's pinned keys (§14.1).
export interface AllowlistInput {
  address: string;
  name: string;
  fingerprint: string;
  provenance: TrustProvenance;
  ed25519Pub?: string; // base64 std
  x25519Pub?: string;  // base64 std
}

interface ContactsContextValue {
  contacts: Contact[];
  // ready is false until the first load resolves — lets consumers avoid acting on
  // an empty list (e.g. gating a message) before contacts are known.
  ready: boolean;
  contactByAddress: (address: string) => ContactRecord | undefined;
  addContact: (contact: Contact) => Promise<void>;
  allowlist: (input: AllowlistInput) => Promise<void>;
  pinKey: (address: string, ed25519Pub: string, x25519Pub: string) => Promise<void>;
  removeContact: (address: string) => Promise<void>;
}

const ContactsContext = createContext<ContactsContextValue | null>(null);

// ContactsProvider owns the address book (synced + E2E) as ONE shared instance for
// the whole app, so consumers (inbox, reader, nav) read already-loaded data instead
// of each re-fetching on mount (which caused the reader's trust flicker). It keeps
// the FULL records (provenance + pinned keys) plus the lightweight projection.
export function ContactsProvider({ children }: { children: ReactNode }) {
  const { keys } = useKeys();
  const { sessionToken, isAuthenticated } = useAuth();
  const [records, setRecords] = useState<ContactRecord[]>([]);
  const [ready, setReady] = useState(false);
  const storeRef = useRef<ContactStore | null>(null);
  const sigRef = useRef('');

  // Gate on the account session (token + auth), not just keys: during device
  // pairing `keys` is installed a beat BEFORE the real account session token is
  // swapped in for the throwaway ephemeral one, so loading on `keys` alone would
  // race the swap, fetch an empty/unauthorized contacts list, and never retry —
  // leaving already-trusted senders miscategorized as pending. Re-running when the
  // token/auth land (as MessagesProvider does) closes that window.
  useEffect(() => {
    if (!keys || !sessionToken || !isAuthenticated) return;
    const store = new ContactStore(keys);
    storeRef.current = store;

    let cancelled = false;
    const load = () =>
      store.list()
        .then((list: ContactRecord[]) => {
          if (cancelled) return;
          const sig = recordsSig(list);
          if (sig !== sigRef.current) { sigRef.current = sig; setRecords(list); }
        })
        .catch(() => { /* transient */ })
        .finally(() => { if (!cancelled) setReady(true); });

    migrateLegacy(store).finally(load);

    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) load();
    }, STORAGE_POLL_INTERVAL_MS);
    const onWake = () => { if (document.visibilityState === 'visible' && navigator.onLine) load(); };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('online', onWake);
    window.addEventListener('focus', onWake);

    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('online', onWake);
      window.removeEventListener('focus', onWake);
      storeRef.current = null;
      setReady(false);
      setRecords([]);
    };
  }, [keys, sessionToken, isAuthenticated]);

  const contacts = useMemo<Contact[]>(
    () => records.map(r => ({ address: r.address, name: r.name, fingerprint: r.fingerprint })).sort(byName),
    [records],
  );

  const recordMap = useMemo(() => {
    const m = new Map<string, ContactRecord>();
    for (const r of records) m.set(normAddr(r.address), r);
    return m;
  }, [records]);

  const contactByAddress = useCallback(
    (address: string): ContactRecord | undefined => recordMap.get(normAddr(address)),
    [recordMap],
  );

  const addContact = useCallback(async (contact: Contact) => {
    if (!storeRef.current) return;
    await storeRef.current.put(contact);
    setRecords(prev => [
      ...prev.filter(c => normAddr(c.address) !== normAddr(contact.address)),
      { v: 2, ...contact, updatedAt: Date.now(), deviceId: '' },
    ]);
  }, []);

  // allowlist adds/updates a contact WITH a trust provenance + pinned keys — the
  // "I trust the sender" first-message-approval action (§14.2.1).
  const allowlist = useCallback(async (input: AllowlistInput) => {
    if (!storeRef.current) return;
    await storeRef.current.put(input);
    setRecords(prev => [
      ...prev.filter(c => normAddr(c.address) !== normAddr(input.address)),
      { v: 2, ...input, updatedAt: Date.now(), deviceId: '' },
    ]);
  }, []);

  // pinKey lazily records a contact's public keys the first time we can confirm them
  // (§14.1.2), so a later unsigned key change is detectable. No-op if not a contact
  // or already pinned.
  const pinKey = useCallback(async (address: string, ed25519Pub: string, x25519Pub: string) => {
    if (!storeRef.current) return;
    await storeRef.current.pinContactKey(address, ed25519Pub, x25519Pub);
    setRecords(prev => prev.map(c =>
      normAddr(c.address) === normAddr(address) && !c.ed25519Pub
        ? { ...c, ed25519Pub, x25519Pub, pinnedAt: Date.now() }
        : c,
    ));
  }, []);

  const removeContact = useCallback(async (address: string) => {
    if (!storeRef.current) return;
    await storeRef.current.delete(address);
    setRecords(prev => prev.filter(c => normAddr(c.address) !== normAddr(address)));
  }, []);

  const value: ContactsContextValue = { contacts, ready, contactByAddress, addContact, allowlist, pinKey, removeContact };
  return createElement(ContactsContext.Provider, { value }, children);
}

export function useContacts(): ContactsContextValue {
  const ctx = useContext(ContactsContext);
  if (!ctx) throw new Error('useContacts must be used within ContactsProvider');
  return ctx;
}
