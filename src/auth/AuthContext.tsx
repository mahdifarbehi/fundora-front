import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { bootstrapSession, getMe, login, logout, type User } from "./api";
import { setOnSessionExpired } from "../lib/authToken";

// Auth/session is UI state, not server data, so it lives in React Context (locked
// decision) — not TanStack Query. Three states: still checking the cookie ("loading"),
// signed in ("authed"), or signed out ("anon").
type AuthState =
  | { status: "loading"; user: null }
  | { status: "authed"; user: User }
  | { status: "anon"; user: null };

interface AuthContextValue {
  status: AuthState["status"];
  user: User | null;
  signIn: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });

  // On app load, try to mint an access token from the refresh cookie (ADR 0002). If it
  // works we fetch the user; otherwise the user must log in.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await bootstrapSession();
      if (cancelled) return;
      if (!ok) {
        setState({ status: "anon", user: null });
        return;
      }
      try {
        const user = await getMe();
        if (!cancelled) setState({ status: "authed", user });
      } catch {
        if (!cancelled) setState({ status: "anon", user: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // When a silent refresh finally fails mid-session, the client calls this — flip to anon
  // so the route guard bounces the user to /login.
  useEffect(() => {
    setOnSessionExpired(() => setState({ status: "anon", user: null }));
    return () => setOnSessionExpired(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      user: state.user,
      signIn: async (phone, password) => {
        await login(phone, password);
        const user = await getMe();
        setState({ status: "authed", user });
      },
      signOut: async () => {
        await logout();
        setState({ status: "anon", user: null });
      },
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
