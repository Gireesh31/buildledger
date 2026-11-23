import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/access";
import { deleteAccountCompletely } from "@/lib/server/admin-store";
import { moveInvitesToEmail } from "@/lib/server/invite-store";
import { listProjectsFor } from "@/lib/server/project-store";
import { destroyAllSessions } from "@/lib/server/session";
import { findUserById, setEmailVerified, setUserAdmin, setUserDisabled, updateProfile } from "@/lib/server/user-store";
import { parseEmail } from "@/lib/validation";

type Context = RouteContext<"/api/admin/users/[userId]">;

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
const notFound = () => bad("User not found.", 404);
const text = (value: unknown, max: number) => (typeof value === "string" && value.trim().length <= max ? value.trim() : null);

/** One account with the projects it owns. */
export async function GET(_request: Request, { params }: Context) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const { userId } = await params;
  const user = await findUserById(userId);
  if (!user) return notFound();
  return NextResponse.json({ user, projects: await listProjectsFor(user.id) });
}

/**
 * Edits an account. Every key is optional:
 * { firstName, lastName, email, phone, location, verified, disabled, isAdmin }.
 * Admins can't disable, demote or delete themselves, so there's always an admin left.
 */
export async function PATCH(request: Request, { params }: Context) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const { userId } = await params;
  const user = await findUserById(userId);
  if (!user) return notFound();
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return bad("Invalid request.");
  const self = user.id === admin.user.id;

  // Check everything before changing anything.
  if (self && typeof body.disabled === "boolean" && body.disabled) return bad("You can't disable your own account.", 403);
  if (self && body.isAdmin === false) return bad("You can't remove your own admin access. Ask another admin.", 403);

  const profileKeys = ["firstName", "lastName", "email", "phone", "location"] as const;
  if (profileKeys.some((key) => key in body)) {
    const firstName = text(body.firstName ?? user.firstName, 50);
    if (!firstName) return bad("First name is required (up to 50 characters).");
    const lastName = text(body.lastName ?? user.lastName, 50);
    if (lastName === null) return bad("Last name must be 50 characters or fewer.");
    const email = parseEmail(body.email ?? user.email);
    if (!email) return bad("Enter a valid email address.");
    const phone = text(body.phone ?? user.phone ?? "", 20);
    if (phone === null || (phone && !/^[+\d][\d\s-]{5,19}$/.test(phone))) return bad("Enter a valid phone number, e.g. 98765 43210.");
    const location = text(body.location ?? user.location ?? "", 100);
    if (location === null) return bad("Location must be 100 characters or fewer.");
    const updated = await updateProfile(user.id, { firstName, lastName, email, phone, location });
    if (updated === "email-taken") return bad("Another account already uses this email.", 409);
    if (!updated) return notFound();
    // Project invites are by email, so they follow the new address.
    if (email !== user.email) await moveInvitesToEmail(user.email, email);
  }

  if (typeof body.verified === "boolean" && body.verified !== Boolean(user.emailVerifiedAt)) {
    await setEmailVerified(user.id, body.verified);
  }
  if (typeof body.disabled === "boolean" && body.disabled !== Boolean(user.disabledAt)) {
    await setUserDisabled(user.id, body.disabled);
    // Signed out on every device straight away.
    if (body.disabled) await destroyAllSessions(user.id);
  }
  if (typeof body.isAdmin === "boolean" && body.isAdmin !== Boolean(user.isAdmin)) {
    await setUserAdmin(user.id, body.isAdmin);
  }
  return NextResponse.json(await findUserById(user.id));
}

/** Deletes the account with the projects it owns: { confirm: "DELETE" }. */
export async function DELETE(request: Request, { params }: Context) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const { userId } = await params;
  const user = await findUserById(userId);
  if (!user) return notFound();
  if (user.id === admin.user.id) return bad("Delete your own account from your profile instead.", 403);
  const body = await request.json().catch(() => null);
  if (body?.confirm !== "DELETE") return bad("Type DELETE to confirm.");
  return NextResponse.json({ deletedProjects: await deleteAccountCompletely(user) });
}
