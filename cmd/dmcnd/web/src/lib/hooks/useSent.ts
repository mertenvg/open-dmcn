import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode, createElement } from 'react';
import type { Preview } from '../api/mailboxRest';
import { SentStore, type SentEntry } from '../api/sentStore';
import { STORAGE_POLL_INTERVAL_MS } from '../config';
import { useKeys } from './useKeys';
import { useAuth } from './useAuth';

// The Sent folder reads from the owner-only personal store ("sent/" namespace), not
// the mailbox. Each entry already carries its plaintext body, so opening a Sent
// message needs no mailbox fetch. The synthetic hash "sent:<messageId>" keys the row
// (distinct from real mailbox hashes so the two sources never collide).

export const SENT_HASH_PREFIX = 'sent:';

export function isSentStoreHash(hash: string): boolean {
  return hash.startsWith(SENT_HASH_PREFIX);
}

function firstLine(s: string, max = 140): string {
  const oneLine = s.replace(/\s+/g, ' ').trim();
  return oneLine.length > max ? oneLine.slice(0, max) : oneLine;
}

// previewOf maps a Sent record to the shared Preview shape the list/reader render.
function previewOf(selfAddress: string, e: SentEntry): Preview {
  const recipients = [...e.to, ...e.cc];
  return {
    hash: SENT_HASH_PREFIX + e.messageId,
    messageId: e.messageId,
    senderAddress: selfAddress,
    recipientAddress: recipients[0] ?? '',
    to: e.to,
    cc: e.cc,
    bcc: e.bcc,
    subject: e.subject,
    snippet: firstLine(e.body),
    sentAt: e.sentAt,
    bodySize: e.body.length,
    attachmentCount: e.attachments.length,
  };
}

interface SentContextValue {
  sent: Preview[];
  error: string | null;
  refreshSent: () => void;
  bodyOf: (hash: string) => string | null;
  deleteSent: (hash: string) => Promise<void>;
}

const SentContext = createContext<SentContextValue | null>(null);

// SentProvider owns a SentStore and polls the "sent/" namespace on the same cadence
// as the mailbox, foreground/online-gated. Sent records are already decrypted client
// side (sealed to us alone); the private key never leaves the browser.
export function SentProvider({ children }: { children: ReactNode }) {
  const { keys } = useKeys();
  const { address, sessionToken, isAuthenticated } = useAuth();
  const [sent, setSent] = useState<Preview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const storeRef = useRef<SentStore | null>(null);
  const bodiesRef = useRef<Map<string, string>>(new Map());
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!keys || !sessionToken || !isAuthenticated || !address) return;

    const store = new SentStore(keys);
    storeRef.current = store;
    const selfAddress = address;

    let cancelled = false;
    const doSync = () => {
      store.list()
        .then(entries => {
          if (cancelled) return;
          const bodies = new Map<string, string>();
          const previews = entries
            .map(en => en.value)
            .sort((a, b) => b.sentAt - a.sentAt)
            .map(e => {
              bodies.set(SENT_HASH_PREFIX + e.messageId, e.body);
              return previewOf(selfAddress, e);
            });
          bodiesRef.current = bodies;
          setSent(previews);
          setError(null);
        })
        .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); });
    };
    syncRef.current = doSync;
    doSync();

    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) doSync();
    }, STORAGE_POLL_INTERVAL_MS);
    const onWake = () => { if (document.visibilityState === 'visible' && navigator.onLine) doSync(); };
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
      bodiesRef.current = new Map();
      syncRef.current = () => {};
      setSent([]);
    };
  }, [keys, sessionToken, isAuthenticated, address]);

  const refreshSent = useCallback(() => syncRef.current(), []);
  const bodyOf = useCallback((hash: string) => bodiesRef.current.get(hash) ?? null, []);
  const deleteSent = useCallback(async (hash: string) => {
    if (!storeRef.current) return;
    const messageId = hash.startsWith(SENT_HASH_PREFIX) ? hash.slice(SENT_HASH_PREFIX.length) : hash;
    await storeRef.current.delete(messageId);
    // Optimistically drop the row so it disappears before the next poll.
    setSent(prev => prev.filter(p => p.messageId !== messageId));
    bodiesRef.current.delete(hash);
  }, []);

  return createElement(
    SentContext.Provider,
    { value: { sent, error, refreshSent, bodyOf, deleteSent } },
    children
  );
}

export function useSent(): SentContextValue {
  const ctx = useContext(SentContext);
  if (!ctx) throw new Error('useSent must be used within SentProvider');
  return ctx;
}
