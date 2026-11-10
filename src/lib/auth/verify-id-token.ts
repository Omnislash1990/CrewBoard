import { createPublicKey, verify } from "node:crypto";

const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

export type VerifiedFirebaseToken = {
  uid: string;
  email: string | null;
};

export class TokenVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenVerificationError";
  }
}

type CertMap = Record<string, string>;

let cachedCerts: { certs: CertMap; expiresAt: number } | null = null;

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

function readJsonPart(value: string): unknown {
  try {
    return JSON.parse(decodeBase64Url(value).toString("utf8")) as unknown;
  } catch {
    throw new TokenVerificationError("Malformed Firebase ID token.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function maxAgeSeconds(header: string | null) {
  const match = header?.match(/max-age=(\d+)/);
  const parsed = match ? Number(match[1]) : 3600;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3600;
}

async function loadGoogleCertificates(): Promise<CertMap> {
  const now = Date.now();
  if (cachedCerts && cachedCerts.expiresAt > now) return cachedCerts.certs;

  const response = await fetch(CERTS_URL);
  if (!response.ok) {
    throw new TokenVerificationError("Could not load Firebase token keys.");
  }
  const certs = (await response.json()) as CertMap;
  cachedCerts = {
    certs,
    expiresAt: now + maxAgeSeconds(response.headers.get("cache-control")) * 1000,
  };
  return certs;
}

export async function verifyFirebaseIdToken(
  idToken: string,
  projectId: string,
  options?: {
    now?: () => number;
    loadCertificates?: () => Promise<CertMap>;
  },
): Promise<VerifiedFirebaseToken> {
  if (idToken.length === 0 || idToken.length > 8192) {
    throw new TokenVerificationError("Malformed Firebase ID token.");
  }

  const parts = idToken.split(".");
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    throw new TokenVerificationError("Malformed Firebase ID token.");
  }

  const header = readJsonPart(parts[0] ?? "");
  const payload = readJsonPart(parts[1] ?? "");
  if (!isRecord(header) || header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new TokenVerificationError("Unsupported Firebase ID token.");
  }
  if (!isRecord(payload)) {
    throw new TokenVerificationError("Malformed Firebase ID token.");
  }

  const certs = await (options?.loadCertificates ?? loadGoogleCertificates)();
  const pem = certs[header.kid];
  if (!pem) {
    throw new TokenVerificationError("Unknown Firebase ID token key.");
  }

  const signed = Buffer.from(`${parts[0]}.${parts[1]}`);
  const signature = decodeBase64Url(parts[2] ?? "");
  const valid = verify("RSA-SHA256", signed, createPublicKey(pem), signature);
  if (!valid) {
    throw new TokenVerificationError("Firebase ID token signature was rejected.");
  }

  const now = (options?.now ?? Date.now)();
  if (payload.aud !== projectId) {
    throw new TokenVerificationError("Firebase ID token audience was rejected.");
  }
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new TokenVerificationError("Firebase ID token issuer was rejected.");
  }
  if (typeof payload.sub !== "string" || payload.sub.length === 0 || payload.sub.length > 128) {
    throw new TokenVerificationError("Firebase ID token subject was rejected.");
  }
  if (typeof payload.exp !== "number" || payload.exp * 1000 <= now) {
    throw new TokenVerificationError("Firebase ID token has expired.");
  }
  if (typeof payload.auth_time !== "number") {
    throw new TokenVerificationError("Firebase ID token is missing auth_time.");
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === "string" ? payload.email : null,
  };
}
