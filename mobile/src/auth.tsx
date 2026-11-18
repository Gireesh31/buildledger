import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@/lib/types";
import { api, loadToken, saveToken, setSignedOutHandler } from "./api";

interface AuthState {
  /** undefined while the saved session is being checked. */
  user: User | null | undefined;
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

  const refresh = useCallback(async () => {
    setUser(await api<User>("/api/account"));
  }, []);

  useEffect(() => {
    setSignedOutHandler(() => {
      void saveToken(null);
      setUser(null);
    });
    // Reopen where the person left off: a saved token that still works means they're signed in.
    loadToken()
      .then((token) => (token ? refresh() : setUser(null)))
      .catch(() => setUser(null));
    return () => setSignedOutHandler(null);
  }, [refresh]);

  const value = useMemo<AuthState>(
    () => ({
      user,
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
        await api("/api/auth/logout", { method: "POST" }).catch(() => {});
        await saveToken(null);
        setUser(null);
      },
      async forget() {
        await saveToken(null);
        setUser(null);
      },
      refresh,
    }),
    [user, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
