import { notFound, redirect } from "next/navigation";
import { isFeatureOn, type FeatureKey } from "@/lib/app-config";
import { getCollection, type CollectionName, type Option } from "@/lib/collections";
import type { LedgerRecord } from "@/lib/types";
import { getProjectAccess } from "./access";
import { loadAppConfig } from "./app-settings";
import { getCurrentUser } from "./session";

/** For project pages: the signed-in user's access, or a 404. */
export async function requirePageAccess(projectId: string) {
  const access = await getProjectAccess(projectId);
  if (!access) notFound();
  return access;
}

/** For pages of a section an admin can switch off: a 404 while it's off. */
export async function requireFeature(key: FeatureKey) {
  await loadAppConfig();
  if (!isFeatureOn(key)) notFound();
}

/** Dropdown options for referenced records, e.g. { workers: [{ value: id, label: name }] }. */
export function toRefOptions(lists: Partial<Record<CollectionName, LedgerRecord[]>>): Partial<Record<CollectionName, Option[]>> {
  return Object.fromEntries(
    Object.entries(lists).map(([name, records]) => {
      const titleField = getCollection(name as CollectionName).titleField;
      return [
        name,
        (records ?? [])
          .map((r) => ({ value: r.id, label: String(r[titleField] ?? "") }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      ];
    }),
  );
}

/**
 * For admin pages: the signed-in admin, or a 404 for everyone else. Each admin page calls this itself
 * (not just the layout), since a page's data is loaded alongside its layout.
 */
export async function requireAdminPage(path = "/admin") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  if (!user.isAdmin) notFound();
  return user;
}
