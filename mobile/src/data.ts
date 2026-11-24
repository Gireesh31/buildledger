import { File, Paths } from "expo-file-system";
import { useFocusEffect, useGlobalSearchParams, useLocalSearchParams } from "expo-router";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { CollectionName } from "@/lib/collections";
import type { LedgerRecord, Project, ProjectRole } from "@/lib/types";
import { api, errorMessage } from "./api";

/** The open project's id, set once by the project layout so every tab sees it (tab screens can lose route params). */
export const ProjectIdContext = createContext("");

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** The id from the route, for the project layout itself. */
export function useRouteProjectId() {
  const local = useLocalSearchParams<{ id?: string | string[] }>();
  const global = useGlobalSearchParams<{ id?: string | string[] }>();
  return first(local.id) || first(global.id);
}

/** The open project's id, inside any screen of a project. */
export function useProjectId() {
  const fromLayout = useContext(ProjectIdContext);
  const fromRoute = useRouteProjectId();
  return fromLayout || fromRoute;
}

export type ProjectWithRole = Project & { role: ProjectRole };

/**
 * Last data each screen showed, so coming back to it is instant, and saved in the app's own storage
 * so the next launch opens straight onto it too (then refreshes). Cleared on sign-out.
 */
const loadCache = new Map<string, unknown>();
const CACHE_VERSION = 1;

const cacheFile = (() => {
  try {
    return new File(Paths.document, "buildledger-cache.json");
  } catch {
    return null; // e.g. the web preview: in-memory only
  }
})();

// Read once at startup, before the first screen draws.
try {
  if (cacheFile?.exists) {
    const saved = JSON.parse(cacheFile.textSync()) as { v?: number; entries?: Record<string, unknown> };
    if (saved.v === CACHE_VERSION && saved.entries) for (const [key, value] of Object.entries(saved.entries)) loadCache.set(key, value);
  }
} catch {
  // A damaged cache only costs one normal load.
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function saveSoon() {
  if (!cacheFile) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    cacheFile.write(JSON.stringify({ v: CACHE_VERSION, entries: Object.fromEntries(loadCache) })).catch(() => {});
  }, 400);
}

export function getCached<T>(key: string): T | undefined {
  return loadCache.get(key) as T | undefined;
}

export function setCached(key: string, value: unknown) {
  loadCache.set(key, value);
  saveSoon();
}

export function clearLoadCache() {
  loadCache.clear();
  clearTimeout(saveTimer);
  try {
    if (cacheFile?.exists) cacheFile.delete();
  } catch {
    // Nothing saved, or already gone.
  }
}

/**
 * Loads data when a screen opens and again each time you come back to it, so it's never stale.
 * With a `cacheKey`, the screen first shows what it showed last time and refreshes in the background.
 * `reload` also drives pull-to-refresh.
 */
export function useLoad<T>(load: () => Promise<T>, cacheKey?: string) {
  const [data, setData] = useState<T | undefined>(() => (cacheKey ? (loadCache.get(cacheKey) as T | undefined) : undefined));
  const keyRef = useRef(cacheKey);
  keyRef.current = cacheKey;
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const loadRef = useRef(load);
  loadRef.current = load;

  const reload = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    try {
      const fresh = await loadRef.current();
      if (keyRef.current) setCached(keyRef.current, fresh);
      setData(fresh);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { data, error, refreshing, reload, onRefresh: () => reload(true) };
}

export const loadProject = (projectId: string) => api<ProjectWithRole>(`/api/projects/${projectId}`);

export const loadRecords = (projectId: string, collection: CollectionName) => api<LedgerRecord[]>(`/api/projects/${projectId}/records/${collection}`);

/** Several collections at once, keyed by name. */
export async function loadCollections<const T extends CollectionName>(projectId: string, names: readonly T[]): Promise<Record<T, LedgerRecord[]>> {
  const lists = await Promise.all(names.map((name) => loadRecords(projectId, name)));
  return Object.fromEntries(names.map((name, i) => [name, lists[i]])) as Record<T, LedgerRecord[]>;
}

export const canWrite = (role: ProjectRole | undefined) => role === "owner" || role === "editor";
