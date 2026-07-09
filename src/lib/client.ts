import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  notifySessionExpired,
} from "./authToken";
import { normalizeError } from "./errors";

// One axios instance for the whole app. baseURL is "/api" so every call goes through the
// Vite dev proxy (same-origin) — which is what lets the httpOnly refresh cookie ride along
// (ADR 0002). withCredentials sends that cookie on the /api/auth/ endpoints.
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Endpoints where a 401 is a *final answer*, not an "access token expired" signal — so we
// must NOT try to silently refresh-and-retry them. A 401 from login means bad credentials;
// a 401 from refresh means the session is truly gone. (/auth/me/ is NOT here: a 401 there
// is a normal expired-token case we do want to refresh.)
const NO_REFRESH_PATHS = [
  "/auth/token/",
  "/auth/token/refresh/",
  "/auth/logout/",
  "/auth/register/",
];

function isNoRefreshPath(url: string | undefined): boolean {
  if (!url) return false;
  return NO_REFRESH_PATHS.some((p) => url.endsWith(p));
}

// --- Silent refresh with a single-flight queue -----------------------------------------
// If ten requests 401 at once, we must call the refresh endpoint exactly ONCE and let all
// ten wait on that single promise, then retry (ADR 0002). refreshPromise is that shared
// in-flight refresh; null when none is running.
let refreshPromise: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  // Use bare axios (not `api`) so this call skips our interceptors entirely — no stale
  // bearer header attached, no recursive 401 handling.
  try {
    const { data } = await axios.post<{ access: string }>(
      "/api/auth/token/refresh/",
      {},
      { withCredentials: true },
    );
    setAccessToken(data.access);
    return data.access;
  } catch (err) {
    // Refresh failed → the session is over. Drop the token and tell the app to log out.
    clearAccessToken();
    notifySessionExpired();
    throw normalizeError(err);
  }
}

/** Get a fresh access token, coalescing concurrent callers onto one refresh call. */
export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// --- Interceptors -----------------------------------------------------------------------

// Attach the in-memory access token as a bearer header on every outgoing request.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On a 401 for a refreshable endpoint: refresh once (queued), then retry the original
// request with the new token. Everything else is normalized to an ApiError and rejected.
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(normalizeError(error));

    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isNoRefreshPath(original.url)
    ) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original as AxiosRequestConfig);
      } catch (refreshErr) {
        return Promise.reject(normalizeError(refreshErr));
      }
    }

    return Promise.reject(normalizeError(error));
  },
);
