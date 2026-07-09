// The access token lives ONLY in memory — a module variable, never localStorage or a
// cookie readable by JS (ADR 0002). It vanishes on tab close; the httpOnly refresh
// cookie is what survives and mints a new one on reload.

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

// The client calls this when refresh finally fails (session truly gone) so the React
// layer can route to /login. Set by the auth provider in Phase 2.
let onSessionExpired: (() => void) | null = null;

export function setOnSessionExpired(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

export function notifySessionExpired(): void {
  onSessionExpired?.();
}
