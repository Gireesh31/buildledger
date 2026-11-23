import type { User } from "@/lib/types";
import { deletePhotoFile } from "./avatar-store";
import { deleteInvitesForEmail } from "./invite-store";
import { deleteProjectAndData } from "./project-cleanup";
import { listProjectsFor } from "./project-store";
import { destroyAllSessions } from "./session";
import { db, must } from "./supabase";
import { deleteUser } from "./user-store";

export interface AdminStats {
  users: number;
  verifiedUsers: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const raw = must(await (await db()).rpc("admin_stats")) as Record<string, unknown>;
  return { users: Number(raw.users) || 0, verifiedUsers: Number(raw.verifiedUsers) || 0 };
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
