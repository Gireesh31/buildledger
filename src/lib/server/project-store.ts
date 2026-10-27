import type { Project } from "@/lib/types";
import type { ProjectFields } from "@/lib/validation";
import { db, iso, isUuid, must } from "./supabase";

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  project_type: Project["projectType"] | null;
  status: Project["status"];
  budget: number | string | null;
  area_sqft: number | string | null;
  start_date: string | null;
  end_date: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

function fromRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    ...(row.description && { description: row.description }),
    ...(row.location && { location: row.location }),
    ...(row.project_type && { projectType: row.project_type }),
    status: row.status,
    ...(row.budget != null && { budget: Number(row.budget) }),
    ...(row.area_sqft != null && { areaSqft: Number(row.area_sqft) }),
    ...(row.start_date && { startDate: row.start_date }),
    ...(row.end_date && { endDate: row.end_date }),
    ownerId: row.owner_id,
    createdAt: iso(row.created_at)!,
    updatedAt: iso(row.updated_at)!,
  };
}

/** Only the fields present in `fields` are written; `undefined` clears an optional field. */
function toColumns(fields: ProjectFields) {
  const map: Record<string, keyof ProjectFields> = {
    name: "name",
    description: "description",
    location: "location",
    project_type: "projectType",
    status: "status",
    budget: "budget",
    area_sqft: "areaSqft",
    start_date: "startDate",
    end_date: "endDate",
  };
  return Object.fromEntries(
    Object.entries(map)
      .filter(([, key]) => key in fields)
      .map(([column, key]) => [column, fields[key] ?? null]),
  );
}

export async function listAllProjects(): Promise<Project[]> {
  return (must(await (await db()).from("projects").select("*")) as ProjectRow[]).map(fromRow);
}

export async function getProject(id: string): Promise<Project | undefined> {
  if (!isUuid(id)) return undefined;
  const row = must(await (await db()).from("projects").select("*").eq("id", id).maybeSingle<ProjectRow>());
  return row ? fromRow(row) : undefined;
}

export async function createProject(fields: ProjectFields & { name: string }, ownerId: string): Promise<Project> {
  const row = must(
    await (await db())
      .from("projects")
      .insert({ status: "planning", ...toColumns(fields), owner_id: ownerId })
      .select("*")
      .single<ProjectRow>(),
  );
  return fromRow(row!);
}

export async function updateProject(id: string, changes: ProjectFields): Promise<Project | undefined> {
  if (!isUuid(id)) return undefined;
  const row = must(
    await (await db())
      .from("projects")
      .update({ ...toColumns(changes), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle<ProjectRow>(),
  );
  return row ? fromRow(row) : undefined;
}

/** Deleting a project also removes its records, attachments rows and invites (foreign keys cascade). */
export async function deleteProject(id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const rows = must(await (await db()).from("projects").delete().eq("id", id).select("id")) as { id: string }[];
  return rows.length > 0;
}
