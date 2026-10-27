import type { User } from "@/lib/types";
import { generateToken, hashToken, hashPassword } from "./crypto";
import { db, iso, isUniqueViolation, isUuid, must } from "./supabase";

interface StoredUser extends User {
  passwordHash: string;
}

interface UserRow {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  password_hash: string;
  photo_type: string | null;
  photo_updated_at: string | null;
  created_at: string;
  onboarded_at: string | null;
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** Splits a single full name at the first space. */
function splitName(name: string): { firstName: string; lastName: string } {
  const [first, ...rest] = name.trim().split(/\s+/);
  return { firstName: first ?? "", lastName: rest.join(" ") };
}

export const fullName = (firstName: string, lastName: string) => [firstName, lastName].filter(Boolean).join(" ");

function fromRow(row: UserRow): StoredUser {
  const photoUrl = row.photo_type && row.photo_updated_at ? `/api/users/${row.id}/photo?v=${Date.parse(row.photo_updated_at)}` : undefined;
  return {
    id: row.id,
    name: row.name,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    ...(row.phone && { phone: row.phone }),
    ...(row.location && { location: row.location }),
    ...(photoUrl && { photoUrl }),
    createdAt: iso(row.created_at)!,
    ...(row.onboarded_at && { onboardedAt: iso(row.onboarded_at) }),
    passwordHash: row.password_hash,
  };
}

function toPublic(user: StoredUser): User {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = user;
  return rest;
}

async function findRow(column: "id" | "email", value: string): Promise<StoredUser | undefined> {
  if (column === "id" && !isUuid(value)) return undefined;
  const row = must(await (await db()).from("users").select("*").eq(column, value).maybeSingle<UserRow>());
  return row ? fromRow(row) : undefined;
}

export async function findUserById(id: string): Promise<User | undefined> {
  const user = await findRow("id", id);
  return user && toPublic(user);
}

/** Includes the password hash; only for verifying credentials. */
export async function findUserWithPasswordByEmail(email: string): Promise<StoredUser | undefined> {
  return findRow("email", email);
}

/** Includes the password hash; only for checking the current password. */
export async function findUserWithPasswordById(id: string): Promise<StoredUser | undefined> {
  return findRow("id", id);
}

export async function createUser(input: { name: string; email: string; password: string }): Promise<User | null> {
  const passwordHash = await hashPassword(input.password);
  const { firstName, lastName } = splitName(input.name);
  const { data, error } = await (await db())
    .from("users")
    .insert({ name: input.name, first_name: firstName, last_name: lastName, email: input.email, password_hash: passwordHash })
    .select("*")
    .single<UserRow>();
  if (isUniqueViolation(error)) return null;
  return toPublic(fromRow(must({ data, error })!));
}

export async function updatePassword(userId: string, password: string) {
  const passwordHash = await hashPassword(password);
  must(await (await db()).from("users").update({ password_hash: passwordHash }).eq("id", userId));
}

export async function createResetToken(userId: string): Promise<string> {
  const token = generateToken();
  const client = await db();
  // One live link per user; expired links are cleaned up along the way.
  must(await client.from("reset_tokens").delete().or(`user_id.eq.${userId},expires_at.lt.${new Date().toISOString()}`));
  must(
    await client
      .from("reset_tokens")
      .insert({ token_hash: hashToken(token), user_id: userId, expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString() }),
  );
  return token;
}

/** Returns the user id if the token is valid, and invalidates it either way. */
export async function consumeResetToken(token: string): Promise<string | null> {
  const rows = must(
    await (await db()).from("reset_tokens").delete().eq("token_hash", hashToken(token)).select("user_id, expires_at"),
  ) as { user_id: string; expires_at: string }[];
  const match = rows[0];
  return match && Date.parse(match.expires_at) > Date.now() ? match.user_id : null;
}

export async function markOnboarded(userId: string) {
  must(await (await db()).from("users").update({ onboarded_at: new Date().toISOString() }).eq("id", userId).is("onboarded_at", null));
}

/** Which of these emails belong to registered users. */
export async function findRegisteredEmails(emails: string[]): Promise<string[]> {
  if (emails.length === 0) return [];
  const rows = must(await (await db()).from("users").select("email").in("email", emails)) as { email: string }[];
  return rows.map((r) => r.email);
}

export interface ProfileChanges {
  firstName: string;
  lastName: string;
  email: string;
  /** Empty string clears it. */
  phone: string;
  location: string;
}

/** Saves the profile. Returns "email-taken" when another account already uses the email. */
export async function updateProfile(userId: string, changes: ProfileChanges): Promise<User | "email-taken" | undefined> {
  const { data, error } = await (await db())
    .from("users")
    .update({
      first_name: changes.firstName,
      last_name: changes.lastName,
      name: fullName(changes.firstName, changes.lastName),
      email: changes.email,
      phone: changes.phone || null,
      location: changes.location || null,
    })
    .eq("id", userId)
    .select("*")
    .maybeSingle<UserRow>();
  if (isUniqueViolation(error)) return "email-taken";
  const row = must({ data, error });
  return row ? toPublic(fromRow(row)) : undefined;
}

/** Records (or clears, with undefined) the user's profile photo type. */
export async function setUserPhoto(userId: string, type: string | undefined): Promise<User | undefined> {
  const row = must(
    await (await db())
      .from("users")
      .update({ photo_type: type ?? null, photo_updated_at: type ? new Date().toISOString() : null })
      .eq("id", userId)
      .select("*")
      .maybeSingle<UserRow>(),
  );
  return row ? toPublic(fromRow(row)) : undefined;
}

/** The stored photo's content type, if the user has one. */
export async function findUserPhotoType(userId: string): Promise<string | undefined> {
  if (!isUuid(userId)) return undefined;
  const row = must(await (await db()).from("users").select("photo_type").eq("id", userId).maybeSingle<{ photo_type: string | null }>());
  return row?.photo_type ?? undefined;
}

/** Removes the account; its sessions and password-reset links go with it (foreign keys cascade). */
export async function deleteUser(userId: string) {
  must(await (await db()).from("users").delete().eq("id", userId));
}
