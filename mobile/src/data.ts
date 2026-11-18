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
 * Loads data when a screen opens and again each time you come back to it, so it's never stale.
 * `reload` also drives pull-to-refresh.
 */
export function useLoad<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const loadRef = useRef(load);
  loadRef.current = load;

  const reload = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    try {
      setData(await loadRef.current());
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
