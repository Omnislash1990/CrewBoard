/**
 * IndexedDB persistence is a browser API. Next.js also evaluates client
 * modules on the server, where `window` is undefined.
 */
export function canUsePersistentFirestoreCache() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}
