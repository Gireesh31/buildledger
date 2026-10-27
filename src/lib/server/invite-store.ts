import type { Invite, InviteRole } from "@/lib/types";
import { db, iso, isUuid, must } from "./supabase";

interface InviteRow {
  id: string;
  project_id: string;
  email: string;
  role: InviteRole;
  invited_by: string | null;
  created_at: string;
}

const fromRow = (row: InviteRow): Invite => ({
  id: row.id,
  projectId: row.project_id,
  email: row.email,
  role: row.role,
  invitedBy: row.invited_by ?? "",
  createdAt: iso(row.created_at)!,
});

export async function listInvites(projectId: string): Promise<Invite[]> {
  if (!isUuid(projectId)) return [];
  return (must(await (await db()).from("invites").select("*").eq("project_id", projectId).order("created_at")) as InviteRow[]).map(fromRow);
}

/** Adds invites for emails not already invited to the project. Returns only the new ones. */
export async function createInvites(input: {
  projectId: string;
  emails: string[];
  role: InviteRole;
  invitedBy: string;
}): Promise<Invite[]> {
  const emails = [...new Set(input.emails)];
  if (emails.length === 0) return [];
  // ON CONFLICT DO NOTHING: emails already invited are skipped and not returned.
  const rows = must(
    await (await db())
      .from("invites")
      .upsert(
        emails.map((email) => ({ project_id: input.projectId, email, role: input.role, invited_by: input.invitedBy })),
        { onConflict: "project_id,email", ignoreDuplicates: true },
      )
      .select("*"),
  ) as InviteRow[];
  return rows.map(fromRow);
}

export async function deleteInvite(projectId: string, inviteId: string): Promise<boolean> {
  if (!isUuid(projectId) || !isUuid(inviteId)) return false;
  const rows = must(await (await db()).from("invites").delete().eq("id", inviteId).eq("project_id", projectId).select("id")) as { id: string }[];
  return rows.length > 0;
}

export async function listInvitesForEmail(email: string): Promise<Invite[]> {
  return (must(await (await db()).from("invites").select("*").eq("email", email)) as InviteRow[]).map(fromRow);
}

export async function deleteProjectInvites(projectId: string) {
  if (!isUuid(projectId)) return;
  must(await (await db()).from("invites").delete().eq("project_id", projectId));
}

/** Keeps project access when someone changes their login email: invites follow the new address. */
export async function moveInvitesToEmail(oldEmail: string, newEmail: string) {
  must(await (await db()).from("invites").update({ email: newEmail }).eq("email", oldEmail));
}

export async function deleteInvitesForEmail(email: string) {
  must(await (await db()).from("invites").delete().eq("email", email));
}
