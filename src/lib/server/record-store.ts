import type { CollectionName } from "@/lib/collections";
import type { LedgerRecord } from "@/lib/types";
import { db, iso, isUuid, must } from "./supabase";

// Every ledger shares one `records` table; each row's fields are in its `data` column.
interface RecordRow {
  id: string;
  collection: string;
  project_id: string;
  data: Record<string, string | number>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const fromRow = (row: RecordRow): LedgerRecord => ({
  ...row.data,
  id: row.id,
  projectId: row.project_id,
  createdBy: row.created_by ?? "",
  createdAt: iso(row.created_at)!,
  updatedAt: iso(row.updated_at)!,
});

export async function listRecords(collection: CollectionName, projectId: string): Promise<LedgerRecord[]> {
  if (!isUuid(projectId)) return [];
  const rows = must(
    await (await db()).from("records").select("*").eq("project_id", projectId).eq("collection", collection).order("created_at"),
  ) as RecordRow[];
  return rows.map(fromRow);
}

/** Loads several collections for one project in one query. */
export async function loadRecords<const T extends CollectionName>(
  projectId: string,
  names: readonly T[],
): Promise<Record<T, LedgerRecord[]>> {
  const result = Object.fromEntries(names.map((name) => [name, [] as LedgerRecord[]])) as Record<T, LedgerRecord[]>;
  if (!isUuid(projectId) || names.length === 0) return result;
  const rows = must(
    await (await db()).from("records").select("*").eq("project_id", projectId).in("collection", names).order("created_at"),
  ) as RecordRow[];
  for (const row of rows) result[row.collection as T].push(fromRow(row));
  return result;
}

export async function recordExists(collection: CollectionName, projectId: string, id: string): Promise<boolean> {
  if (!isUuid(projectId) || !isUuid(id)) return false;
  const { count } = await (await db())
    .from("records")
    .select("id", { count: "exact", head: true })
    .eq("id", id)
    .eq("project_id", projectId)
    .eq("collection", collection);
  return (count ?? 0) > 0;
}

export async function createRecord(
  collection: CollectionName,
  projectId: string,
  createdBy: string,
  values: Record<string, string | number>,
): Promise<LedgerRecord> {
  const row = must(
    await (await db()).from("records").insert({ collection, project_id: projectId, created_by: createdBy, data: values }).select("*").single<RecordRow>(),
  );
  return fromRow(row!);
}

/** Replaces the record's fields (not merges), so cleared optional fields are removed. */
export async function replaceRecord(
  collection: CollectionName,
  projectId: string,
  id: string,
  values: Record<string, string | number>,
): Promise<LedgerRecord | undefined> {
  if (!isUuid(projectId) || !isUuid(id)) return undefined;
  const row = must(
    await (await db())
      .from("records")
      .update({ data: values, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("project_id", projectId)
      .eq("collection", collection)
      .select("*")
      .maybeSingle<RecordRow>(),
  );
  return row ? fromRow(row) : undefined;
}

export async function deleteRecord(collection: CollectionName, projectId: string, id: string): Promise<boolean> {
  if (!isUuid(projectId) || !isUuid(id)) return false;
  const rows = must(
    await (await db()).from("records").delete().eq("id", id).eq("project_id", projectId).eq("collection", collection).select("id"),
  ) as { id: string }[];
  return rows.length > 0;
}

/** Sets attendance for one day: one entry per worker, replacing whatever was there. */
export async function setAttendanceForDay(
  projectId: string,
  date: string,
  entries: { workerId: string; status: string }[],
  createdBy: string,
) {
  const client = await db();
  must(await client.from("records").delete().eq("project_id", projectId).eq("collection", "attendance").eq("data->>date", date));
  if (entries.length === 0) return;
  must(
    await client.from("records").insert(
      entries.map((entry) => ({
        collection: "attendance",
        project_id: projectId,
        created_by: createdBy,
        data: { date, workerId: entry.workerId, status: entry.status },
      })),
    ),
  );
}

/** Removes all of a project's records, e.g. when the project is deleted. */
export async function deleteProjectRecords(projectId: string, names: readonly CollectionName[]) {
  if (!isUuid(projectId) || names.length === 0) return;
  must(await (await db()).from("records").delete().eq("project_id", projectId).in("collection", names));
}
