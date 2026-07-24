// Persistent storage. The encrypted keystore lives ONLY in IndexedDB (no server
// copy), so a best-effort-storage eviction under disk pressure — or Safari/WebKit's
// ~7-day no-interaction cap on script-writable storage — would de-provision this
// device (recoverable only via pairing or the exported backup file). Requesting
// persistent storage exempts the origin from eviction.
//
// The grant is heuristic and may be denied (Chrome grants silently for
// installed/engaged sites; Firefox prompts; Safari has its own rules), so this is a
// probability reducer, NOT a guarantee — the export backup remains the real safety
// net for total data loss.

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function isStoragePersisted(): Promise<boolean> {
  try {
    if (!navigator.storage?.persisted) return false;
    return await navigator.storage.persisted();
  } catch {
    return false;
  }
}
