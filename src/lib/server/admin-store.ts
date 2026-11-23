import type { Project, User } from "@/lib/types";
import { deletePhotoFile } from "./avatar-store";
import { deleteInvitesForEmail } from "./invite-store";
import { deleteProjectAndData } from "./project-cleanup";
import { listAllProjectsRaw, listProjectsFor } from "./project-store";
import { destroyAllSessions } from "./session";
import { db, must } from "./supabase";
import { deleteUser, findUsersByIds } from "./user-store";

export interface AdminStats {
  users: number;
  verifiedUsers: number;
  disabledUsers: number;
  admins: number;
  newUsers30d: number;
  projects: number;
  projectsByStatus: Record<string, number>;
  records: number;
  recordsByCollection: Record<string, number>;
  files: number;
  materialSpend: number;
  transportSpend: number;
  labourPaid: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const raw = must(await (await db()).rpc("admin_stats")) as Record<string, unknown>;
  return {
    ...(raw as unknown as AdminStats),
    materialSpend: Number(raw.materialSpend) || 0,
    transportSpend: Number(raw.transportSpend) || 0,
    labourPaid: Number(raw.labourPaid) || 0,
  };
}

export interface AdminProjectRow {
  project: Project;
  owner?: Pick<User, "id" | "name" | "email">;
  entries: number;
  /** Materials + transport bills (labour depends on attendance, so it's left to the project's own pages). */
  billed: number;
}

/** Every project, most recently active first, with its owner and a rough size. */
export async function listAllProjects(search = ""): Promise<AdminProjectRow[]> {
  const client = await db();
  const projects = await listAllProjectsRaw(search);
  const ids = projects.map((p) => p.id);
  const records = ids.length
    ? (must(await client.from("records").select("project_id, collection, amount:data->>amount").in("project_id", ids)) as {
        project_id: string;
        collection: string;
        amount: string | null;
      }[])
    : [];
  const owners = await findUsersByIds(projects.map((p) => p.ownerId));
  return projects.map((project) => {
    const own = records.filter((r) => r.project_id === project.id);
    const owner = owners.find((u) => u.id === project.ownerId);
    return {
      project,
      ...(owner && { owner: { id: owner.id, name: owner.name, email: owner.email } }),
      entries: own.length,
      billed: own
        .filter((r) => r.collection === "materials" || r.collection === "transport")
        .reduce((total, r) => total + (Number(r.amount) || 0), 0),
    };
  });
}

/** Removes an account the way "Delete account" does: owned projects with their data, invites, sessions and photo. */
export async function deleteAccountCompletely(user: User): Promise<number> {
  const owned = await listProjectsFor(user.id);
  for (const project of owned) await deleteProjectAndData(project.id);
  await deleteInvitesForEmail(user.email);
  await destroyAllSessions(user.id);
  await deleteUser(user.id);
  await deletePhotoFile(user.id);
  return owned.length;
}
