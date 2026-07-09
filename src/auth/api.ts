import { api, refreshAccessToken } from "../lib/client";
import { setAccessToken, clearAccessToken } from "../lib/authToken";
import type { components } from "../lib/api-types";

export type User = components["schemas"]["User"];
type AccessTokenResponse = components["schemas"]["AccessTokenResponse"];

/**
 * Self-register / activate an account (FRONTEND_API §4.1). `201` = brand-new phone,
 * `200` = a pre-created password-less member activated by setting this password.
 * Throws ApiError("VALIDATION_ERROR") with fields like phone:["already_registered"].
 */
export async function register(
  phone: string,
  password: string,
  full_name = "",
): Promise<User> {
  const { data } = await api.post<User>("/auth/register/", {
    phone,
    full_name,
    password,
  });
  return data;
}

/**
 * Log in with phone + password. On success the access token is stored in memory and the
 * refresh token is set as an httpOnly cookie by the server (FRONTEND_API §4.2).
 * Throws ApiError("NO_ACTIVE_ACCOUNT") on wrong credentials.
 */
export async function login(phone: string, password: string): Promise<void> {
  const { data } = await api.post<AccessTokenResponse>("/auth/token/", {
    phone,
    password,
  });
  setAccessToken(data.access);
}

/**
 * Log out: blacklist + clear the refresh cookie server-side, then drop the in-memory
 * access token. Idempotent and safe even with an expired access token (FRONTEND_API §4.5).
 */
export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout/", {});
  } finally {
    clearAccessToken();
  }
}

/** The current user (FRONTEND_API §4.4). Requires a valid session. */
export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me/");
  return data;
}

/**
 * Called on app load: try to mint an access token from the refresh cookie left by a prior
 * session. Returns true if we now have a session, false if the user must log in.
 */
export async function bootstrapSession(): Promise<boolean> {
  try {
    await refreshAccessToken();
    return true;
  } catch {
    return false;
  }
}
