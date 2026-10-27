import { cookies } from "next/headers";
import { cache } from "react";
import type { User } from "@/lib/types";
import { generateToken, hashToken } from "./crypto";
import { db, must } from "./supabase";
import { findUserById } from "./user-store";

const SESSION_COOKIE = "builder_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const client = await db();
  // Clear out expired sessions along the way.
  must(await client.from("sessions").delete().lt("expires_at", new Date().toISOString()));
  must(await client.from("sessions").insert({ token_hash: hashToken(token), user_id: userId, expires_at: expiresAt.toISOString() }));

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** The signed-in user, looked up once per request (layouts, pages and menus all ask). */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = must(
    await (await db()).from("sessions").select("user_id, expires_at").eq("token_hash", hashToken(token)).maybeSingle<{ user_id: string; expires_at: string }>(),
  );
  if (!session || Date.parse(session.expires_at) <= Date.now()) return null;
  return (await findUserById(session.user_id)) ?? null;
});

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) must(await (await db()).from("sessions").delete().eq("token_hash", hashToken(token)));
  cookieStore.delete(SESSION_COOKIE);
}

/** Signs the user out everywhere, e.g. after a password reset. */
export async function destroyAllSessions(userId: string) {
  must(await (await db()).from("sessions").delete().eq("user_id", userId));
}

/** Signs the user out on every other device, keeping this browser's session (e.g. after a password change). */
export async function destroyOtherSessions(userId: string) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  let query = (await db()).from("sessions").delete().eq("user_id", userId);
  if (token) query = query.neq("token_hash", hashToken(token));
  must(await query);
}

/** Signs the user out everywhere and clears this browser's cookie (e.g. when the account is deleted). */
export async function endAllSessions(userId: string) {
  await destroyAllSessions(userId);
  (await cookies()).delete(SESSION_COOKIE);
}
