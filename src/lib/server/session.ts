import { cookies, headers } from "next/headers";
import { cache } from "react";
import type { User } from "@/lib/types";
import { generateToken, hashToken } from "./crypto";
import { db, must } from "./supabase";
import { findUserById } from "./user-store";

const SESSION_COOKIE = "builder_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** How long after the last renewal a session's expiry is pushed forward again. */
const RENEW_AFTER_MS = 24 * 60 * 60 * 1000;

/** Starts a session and sets the browser cookie; returns the token too, for the mobile app (sent back as a Bearer header). */
export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const client = await db();
  // Clear out expired sessions along the way.
  must(await client.from("sessions").delete().lt("expires_at", new Date().toISOString()));
  must(await client.from("sessions").insert({ token_hash: hashToken(token), user_id: userId, expires_at: expiresAt.toISOString() }));

  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(expiresAt));
  return token;
}

const cookieOptions = (expires: Date) =>
  ({ httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires }) as const;

/** The session token: the browser's cookie, or the mobile app's "Authorization: Bearer …" header. */
async function sessionToken(): Promise<string | undefined> {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (cookie) return cookie;
  const auth = (await headers()).get("authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7).trim() || undefined : undefined;
}

/** The signed-in user, looked up once per request (layouts, pages and menus all ask). */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = await sessionToken();
  if (!token) return null;
  const session = must(
    await (await db()).from("sessions").select("user_id, expires_at").eq("token_hash", hashToken(token)).maybeSingle<{ user_id: string; expires_at: string }>(),
  );
  if (!session || Date.parse(session.expires_at) <= Date.now()) return null;
  const user = await findUserById(session.user_id);
  // An admin has blocked this account: its sessions no longer count.
  if (!user || user.disabledAt) return null;
  await keepAlive(token, Date.parse(session.expires_at));
  return user;
});

/**
 * Sessions end after 7 days without use, not 7 days after signing in: while someone keeps using the
 * app or site, the expiry moves forward (at most once a day, so this isn't a write per request).
 */
async function keepAlive(token: string, expiresAt: number) {
  if (expiresAt - Date.now() > SESSION_TTL_MS - RENEW_AFTER_MS) return;
  const next = new Date(Date.now() + SESSION_TTL_MS);
  try {
    must(await (await db()).from("sessions").update({ expires_at: next.toISOString() }).eq("token_hash", hashToken(token)));
  } catch (error) {
    console.error("Couldn't extend the session:", error);
    return;
  }
  // The website's cookie carries its own expiry; refresh it too where cookies can be set (route
  // handlers and actions; pages can't, and those visits still extend the session above).
  try {
    const jar = await cookies();
    if (jar.get(SESSION_COOKIE)?.value === token) jar.set(SESSION_COOKIE, token, cookieOptions(next));
  } catch {
    // Rendering a page: cookies are read-only here.
  }
}

export async function destroySession() {
  const token = await sessionToken();
  if (token) must(await (await db()).from("sessions").delete().eq("token_hash", hashToken(token)));
  (await cookies()).delete(SESSION_COOKIE);
}

/** Signs the user out everywhere, e.g. after a password reset. */
export async function destroyAllSessions(userId: string) {
  must(await (await db()).from("sessions").delete().eq("user_id", userId));
}

/** Signs the user out on every other device, keeping this browser's session (e.g. after a password change). */
export async function destroyOtherSessions(userId: string) {
  const token = await sessionToken();
  let query = (await db()).from("sessions").delete().eq("user_id", userId);
  if (token) query = query.neq("token_hash", hashToken(token));
  must(await query);
}

/** Signs the user out everywhere and clears this browser's cookie (e.g. when the account is deleted). */
export async function endAllSessions(userId: string) {
  await destroyAllSessions(userId);
  (await cookies()).delete(SESSION_COOKIE);
}
