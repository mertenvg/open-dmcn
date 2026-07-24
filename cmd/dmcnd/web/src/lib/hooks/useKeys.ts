import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode, createElement } from 'react';
import type { IdentityKeyPair } from '../crypto/keys';
import { toBase64 } from '../crypto/keys';
import {
  type WorkingKeys,
  importWorkingKeys,
  saveWorkingKeys,
  loadWorkingKeys,
  clearWorkingKeys,
  gcWorkingHandles,
} from '../crypto/workingKeys';
import { loadLocalKeystore, migrateLegacyKeystore } from '../crypto/localKeystore';
import { requestPersistentStorage } from '../crypto/storage';
import { isStaySignedIn, workingKeyRef, getTabId, startPresence, liveTabIds } from '../sessionLifetime';
import { useAuth } from './useAuth';

interface KeysContextValue {
  keys: WorkingKeys | null;
  loading: boolean;
  // setKeys imports a freshly-decrypted raw key pair into non-extractable working
  // handles for `address`, persists them under this tab's session ref (so a refresh
  // doesn't re-prompt; a tab close orphans them for GC), and returns them so the caller
  // can sign the login challenge immediately. Temporary access reuses this — it just
  // skips writing the encrypted keystore, so no re-login material lands on disk.
  setKeys: (address: string, kp: IdentityKeyPair) => Promise<WorkingKeys>;
  // clearKeys locks the current tab's account (drops its working handles); the
  // encrypted keystore stays so the account can be unlocked again.
  clearKeys: () => Promise<void>;
}

const KeysContext = createContext<KeysContextValue | null>(null);

// Working handles are scoped to the tab's session via sessionLifetime.workingKeyRef:
// by default a per-tab id (sessionStorage) keys the handle, so closing the tab/browser
// orphans it and re-unlock is required — a refresh keeps the same id and re-loads the
// handle with no prompt. "Stay signed in" instead keys by account for persistence.
// Handles are non-extractable CryptoKeys — never raw bytes in web storage.
//
// Safety: a tab only ever loads the handle at its own ref and rejects one whose
// account doesn't match its session, so it can't sign relay challenges with the wrong
// account's key; a missing/mismatched handle forces a clean re-unlock.
export function KeysProvider({ children }: { children: ReactNode }) {
  const [keys, setKeysState] = useState<WorkingKeys | null>(null);
  const [loading, setLoading] = useState(true);
  const { address } = useAuth();
  const gcDone = useRef(false);
  // Mirror of `keys` so the address effect can tell "already unlocked in memory"
  // (including a non-persisted temporary session) from "needs loading from disk".
  const keysRef = useRef<WorkingKeys | null>(null);
  const setBoth = useCallback((wk: WorkingKeys | null) => { keysRef.current = wk; setKeysState(wk); }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      await migrateLegacyKeystore();
      // One sweep per app load: drop closed-tab orphan handles (their tab id isn't in
      // the live set) and any persistent handles left over when stay-signed-in is off.
      // Include this tab's id so its own handle is never swept.
      if (!gcDone.current) {
        gcDone.current = true;
        const live = liveTabIds();
        live.add(getTabId());
        await gcWorkingHandles(isStaySignedIn(), live);
      }
      if (!address) {
        if (!cancelled) { setBoth(null); setLoading(false); }
        return;
      }
      // Already unlocked in memory for this account (a normal session just established,
      // or a temporary in-memory session) — keep those handles, don't reload/clobber.
      if (keysRef.current && keysRef.current.address === address) {
        if (!cancelled) setLoading(false);
        return;
      }
      const ref = workingKeyRef(address);
      let wk = await loadWorkingKeys(ref);
      // Reject a handle that isn't this account's (e.g. a per-tab ref reused after an
      // account switch), or that doesn't match the keystore (stale).
      if (wk && wk.address !== address) wk = null;
      if (wk) {
        const ks = await loadLocalKeystore(address);
        if (ks && toBase64(wk.ed25519Public) !== ks.ed25519Public) {
          await clearWorkingKeys(ref);
          wk = null;
        }
      }
      if (!cancelled) { setBoth(wk); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [address]);

  // Announce this tab is open (any tab, authenticated or not) so other tabs' GC keeps
  // its handle and reaps only genuine closed-tab orphans.
  useEffect(() => startPresence(), []);

  const setKeys = useCallback(async (addr: string, kp: IdentityKeyPair) => {
    const wk = await importWorkingKeys(addr, kp);
    await saveWorkingKeys(workingKeyRef(addr), wk);
    // The local keystore is the only at-rest copy, so ask the browser to exempt this
    // origin from storage eviction (best-effort; the export backup is the real net).
    void requestPersistentStorage();
    setBoth(wk);
    setLoading(false);
    return wk;
  }, [setBoth]);

  const clearKeys = useCallback(async () => {
    if (address) await clearWorkingKeys(workingKeyRef(address));
    setBoth(null);
  }, [address, setBoth]);

  return createElement(KeysContext.Provider, { value: { keys, loading, setKeys, clearKeys } }, children);
}

export function useKeys(): KeysContextValue {
  const ctx = useContext(KeysContext);
  if (!ctx) throw new Error('useKeys must be used within KeysProvider');
  return ctx;
}
