import { NextResponse } from "next/server";
import { cache } from "react";
import type { Project, ProjectRole, User } from "@/lib/types";
import { loadAppConfig } from "./app-settings";
import { listInvitesForEmail } from "./invite-store";
import { getProject, listProjectsFor } from "./project-store";
import { getCurrentUser } from "./session";

export interface ProjectAccess {
  user: User;
  project: Project;
  role: ProjectRole;
}

/**
 * Owners have full access; anyone invited by email gets the invite's role.
 * Cached per request, so a layout and its page can both call it.
 */
export const getProjectAccess = cache(async (projectId: string): Promise<ProjectAccess | null> => {
  // All at once rather than one after another: the project is only returned once the user checks
  // out below. Also the form choices, extra fields and feature switches the admin set.
  const [user, project] = await Promise.all([getCurrentUser(), getProject(projectId), loadAppConfig()]);
  if (!user || !project) return null;
  if (project.ownerId === user.id) return { user, project, role: "owner" };
  // Invites are by email, so they only count once the person has proven they own that email.
  if (!user.emailVerifiedAt) return null;
  const invite = (await listInvitesForEmail(user.email)).find((i) => i.projectId === projectId);
  return invite ? { user, project, role: invite.role } : null;
});

export async function listAccessibleProjects(user: User): Promise<{ project: Project; role: ProjectRole }[]> {
  const invites = user.emailVerifiedAt ? await listInvitesForEmail(user.email) : [];
  const invitedRoles = new Map(invites.map((i) => [i.projectId, i.role]));
  const projects = await listProjectsFor(user.id, [...invitedRoles.keys()]);
  return projects
    .flatMap((project): { project: Project; role: ProjectRole }[] => {
      if (project.ownerId === user.id) return [{ project, role: "owner" }];
      const role = invitedRoles.get(project.id);
      return role ? [{ project, role }] : [];
    })
    .sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt));
}

export const canWrite = (role: ProjectRole) => role !== "viewer";

type Need = "read" | "write" | "owner";

/** For route handlers: resolves access or returns the error response to send. */
export async function requireProjectAccess(
  projectId: string,
  need: Need,
): Promise<{ ok: true; access: ProjectAccess } | { ok: false; response: NextResponse }> {
  const [user, access] = await Promise.all([getCurrentUser(), getProjectAccess(projectId)]);
  if (!user) return { ok: false, response: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  // 404 rather than 403, so project ids can't be probed.
  if (!access) return { ok: false, response: NextResponse.json({ error: "Project not found." }, { status: 404 }) };
  const allowed = need === "read" || (need === "write" ? canWrite(access.role) : access.role === "owner");
  if (!allowed) {
    const message = need === "owner" ? "Only the project owner can do this." : "You have view-only access.";
    return { ok: false, response: NextResponse.json({ error: message }, { status: 403 }) };
  }
  return { ok: true, access };
}

/** For route handlers in /api/admin: the signed-in admin, or the 401/403 to send. Checked on the server every time. */
export async function requireAdmin(): Promise<{ ok: true; user: User } | { ok: false; response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  if (!user.isAdmin) return { ok: false, response: NextResponse.json({ error: "Admins only." }, { status: 403 }) };
  return { ok: true, user };
}
