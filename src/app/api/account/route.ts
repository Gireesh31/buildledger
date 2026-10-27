import { NextResponse } from "next/server";
import { deletePhotoFile } from "@/lib/server/avatar-store";
import { verifyPassword } from "@/lib/server/crypto";
import { deleteInvitesForEmail, moveInvitesToEmail } from "@/lib/server/invite-store";
import { deleteProjectAndData } from "@/lib/server/project-cleanup";
import { listAllProjects } from "@/lib/server/project-store";
import { destroyOtherSessions, endAllSessions, getCurrentUser } from "@/lib/server/session";
import { deleteUser, findUserWithPasswordById, updatePassword, updateProfile } from "@/lib/server/user-store";
import { PASSWORD_MIN_LENGTH, parseEmail, parsePassword } from "@/lib/validation";

const signedOut = () => NextResponse.json({ error: "Please sign in." }, { status: 401 });
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
const text = (value: unknown, max: number) => (typeof value === "string" && value.trim().length <= max ? value.trim() : null);

/**
 * Saves the whole profile form:
 * { firstName, lastName, phone, email, location, password?, currentPassword? }.
 * Changing the email or setting a new password needs the current password.
 */
export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return signedOut();
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return bad("Invalid request.");

  const firstName = text(body.firstName, 50);
  if (!firstName) return bad("First name is required (up to 50 characters).");
  const lastName = text(body.lastName ?? "", 50);
  if (lastName === null) return bad("Last name must be 50 characters or fewer.");
  const email = parseEmail(body.email);
  if (!email) return bad("Enter a valid email address.");
  const phone = text(body.phone ?? "", 20);
  if (phone === null || (phone && !/^[+\d][\d\s-]{5,19}$/.test(phone))) return bad("Enter a valid phone number, e.g. 98765 43210.");
  const location = text(body.location ?? "", 100);
  if (location === null) return bad("Location must be 100 characters or fewer.");

  const newPassword = typeof body.password === "string" && body.password !== "" ? parsePassword(body.password) : undefined;
  if (newPassword === null) return bad(`New password must be at least ${PASSWORD_MIN_LENGTH} characters.`);

  const emailChanged = email !== user.email;
  if (emailChanged || newPassword) {
    const stored = await findUserWithPasswordById(user.id);
    if (!stored || typeof body.currentPassword !== "string" || !(await verifyPassword(body.currentPassword, stored.passwordHash))) {
      return bad("Current password is incorrect.", 403);
    }
  }

  const updated = await updateProfile(user.id, { firstName, lastName, email, phone, location });
  if (updated === "email-taken") return bad("Another account already uses this email.", 409);
  if (!updated) return signedOut();
  // Project invites are by email, so they follow the new address.
  if (emailChanged) await moveInvitesToEmail(user.email, email);
  if (newPassword) {
    await updatePassword(user.id, newPassword);
    await destroyOtherSessions(user.id);
  }
  return NextResponse.json({ user: updated, passwordChanged: Boolean(newPassword) });
}

/**
 * Deletes the signed-in user's account: { password, confirm: "DELETE" }.
 * Projects they own are deleted with all their data; access to projects shared with them ends.
 */
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return signedOut();

  const body = await request.json().catch(() => null);
  if (body?.confirm !== "DELETE") return bad("Type DELETE to confirm.");
  const stored = await findUserWithPasswordById(user.id);
  if (!stored || typeof body.password !== "string" || !(await verifyPassword(body.password, stored.passwordHash))) {
    return bad("Password is incorrect.", 403);
  }

  const owned = (await listAllProjects()).filter((p) => p.ownerId === user.id);
  for (const project of owned) await deleteProjectAndData(project.id);
  await deleteInvitesForEmail(user.email);
  await endAllSessions(user.id);
  await deleteUser(user.id);
  await deletePhotoFile(user.id);
  return NextResponse.json({ deletedProjects: owned.length });
}
