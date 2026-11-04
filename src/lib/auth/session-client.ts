import { SESSION_COOKIE } from "@/lib/auth/constants";
import type { SessionPayload } from "@/lib/auth/session-payload";

export function setSessionCookie(payload: SessionPayload) {
  const value = encodeURIComponent(JSON.stringify(payload));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
}

export function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
