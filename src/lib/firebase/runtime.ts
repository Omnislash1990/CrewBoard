/**
 * IndexedDB persistence is a browser API. Next.js also evaluates client
 * modules on the server, where `window` is undefined. Some private-browsing
 * modes throw when `indexedDB` is read, which must not take down Auth.
 */
export function canUsePersistentFirestoreCache() {
  try {
    return (
      typeof window !== "undefined" &&
      typeof indexedDB === "object" &&
      indexedDB !== null
    );
  } catch {
    return false;
  }
}
