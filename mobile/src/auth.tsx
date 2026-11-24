import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@/lib/types";
import { api, ApiError, errorMessage, loadToken, saveToken, setSignedOutHandler } from "./api";
import { clearLoadCache, getCached, setCached } from "./data";

/** The signed-in account, saved with the screens' data so the app can open without waiting on the server. */
const ACCOUNT_KEY = "account";

interface AuthState {
  /** undefined while the saved session is being checked. */
  user: User | null | undefined;
  /** Set when the saved session couldn't be checked (no internet, server down): still signed in, just not reachable. */
  startupError: string | null;
  /** Tries the saved session again after startupError. */
  retry(): void;
  signIn(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  /** Drops the saved session without calling the server (the account was just deleted). */
  forget(): Promise<void>;
  refresh(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Where to go once the home screen has appeared after the welcome steps (e.g. "New project" from "Get started"). */
export const afterWelcome: { route: "/projects/new" | null } = { route: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [startupError, setStartupError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const account = await api<User>("/api/account");
    setCached(ACCOUNT_KEY, account);
    setUser(account);
  }, []);

  // Reopen where the person left off: a saved token that still works means they're signed in.
  // With the account saved from last time, the app opens on it straight away and checks with the
  // server in the background. Only the server saying "signed out" (401) leads to the sign-in screen;
  // no internet or a server hiccup keeps the session (and, without saved data, offers to try again).
  const restore = useCallback(() => {
    setStartupError(null);
    loadToken()
      .then((token) => {
        if (!token) return setUser(null);
        const saved = getCached<User>(ACCOUNT_KEY);
        setUser(saved);
        return refresh().catch((error) => {
          if (error instanceof ApiError && error.status === 401) return setUser(null);
          if (!saved) throw error;
        });
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) setUser(null);
        else setStartupError(errorMessage(error));
      });
  }, [refresh]);

  useEffect(() => {
    setSignedOutHandler(() => {
      void saveToken(null);
      clearLoadCache();
      setUser(null);
    });
    restore();
    return () => setSignedOutHandler(null);
  }, [restore]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      startupError,
      retry: restore,
      async signIn(email, password) {
        const { token } = await api<{ token: string }>("/api/auth/login", { body: { email, password, client: "mobile" } });
        await saveToken(token);
        await refresh();
      },
      async register(name, email, password) {
        const { token } = await api<{ token: string }>("/api/auth/register", { body: { name, email, password, client: "mobile" } });
        await saveToken(token);
        await refresh();
      },
      async signOut() {
        clearLoadCache();
        await api("/api/auth/logout", { method: "POST" }).catch(() => {});
        await saveToken(null);
        setUser(null);
      },
      async forget() {
        clearLoadCache();
        await saveToken(null);
        setUser(null);
      },
      refresh,
    }),
    [user, startupError, restore, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
