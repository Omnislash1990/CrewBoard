/** Reads a Firebase ID token. The session cookie is intentionally not accepted. */
export function bearerToken(authorization: string | null) {
  const match = /^Bearer\s+(\S+)$/i.exec(authorization ?? "");
  return match?.[1] ?? null;
}
