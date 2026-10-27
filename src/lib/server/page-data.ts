import { notFound } from "next/navigation";
import { getCollection, type CollectionName, type Option } from "@/lib/collections";
import type { LedgerRecord } from "@/lib/types";
import { getProjectAccess } from "./access";

/** For project pages: the signed-in user's access, or a 404. */
export async function requirePageAccess(projectId: string) {
  const access = await getProjectAccess(projectId);
  if (!access) notFound();
  return access;
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
