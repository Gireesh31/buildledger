/**
 * The admin's settings (form choices, extra fields, feature switches) from the server, so the app's
 * forms and sections match the website. Loaded after sign-in and again whenever the app comes back
 * to the foreground; the admin screens call `reload` right after saving.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { applyAppConfig, defaultAppConfig, isFeatureOn, type AppConfig, type FeatureKey } from "@/lib/app-config";
import { api } from "./api";

interface ConfigState {
  config: AppConfig;
  /** False until the first load finished (or failed: then the built-in forms are used). */
  ready: boolean;
  reload(): Promise<void>;
  /** Applies settings the server just returned (after an admin saved them). */
  set(config: AppConfig): void;
}

const ConfigContext = createContext<ConfigState>({ config: defaultAppConfig, ready: true, reload: async () => {}, set: () => {} });

export function AppConfigProvider({ signedIn, children }: { signedIn: boolean; children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(defaultAppConfig);
  const [ready, setReady] = useState(false);

  const set = useCallback((next: AppConfig) => {
    applyAppConfig(next);
    setConfig(next);
  }, []);

  const reload = useCallback(async () => {
    try {
      set(await api<AppConfig>("/api/config"));
    } catch {
      // Offline: keep what we have; the server still checks every save.
    } finally {
      setReady(true);
    }
  }, [set]);

  useEffect(() => {
    if (!signedIn) return;
    void reload();
    const sub = AppState.addEventListener("change", (state) => state === "active" && void reload());
    return () => sub.remove();
  }, [signedIn, reload]);

  const value = useMemo(() => ({ config, ready: ready || !signedIn, reload, set }), [config, ready, signedIn, reload, set]);
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export const useAppConfig = () => useContext(ConfigContext);

/** Whether a section is switched on; re-renders when the settings change. */
export function useFeature(key: FeatureKey): boolean {
  useAppConfig();
  return isFeatureOn(key);
}
