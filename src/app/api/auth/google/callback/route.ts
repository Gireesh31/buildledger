import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { generateToken } from "@/lib/server/crypto";
import { fetchGoogleProfile, GOOGLE_STATE_COOKIE, googleRedirectUri, safeNext } from "@/lib/server/google";
import { createSession, destroyAllSessions } from "@/lib/server/session";
import { createUser, findUserWithPasswordByEmail, setEmailVerified, updatePassword } from "@/lib/server/user-store";

/** Google sends the browser back here: sign in the matching account, or create one. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const fail = () => NextResponse.redirect(new URL("/login?error=google", url));

  const cookieStore = await cookies();
  const saved = cookieStore.get(GOOGLE_STATE_COOKIE)?.value;
  cookieStore.delete(GOOGLE_STATE_COOKIE);
  let expected: { state?: string; next?: string } = {};
  try {
    expected = saved ? JSON.parse(saved) : {};
  } catch {}
  const code = url.searchParams.get("code");
  if (!code || !expected.state || url.searchParams.get("state") !== expected.state) return fail();

  const profile = await fetchGoogleProfile(code, googleRedirectUri(request));
  if (!profile) return fail();

  // Same email as an existing account signs into it; otherwise a new account is made.
  // New accounts get a random password nobody knows; "Forgot password" can set one later.
  const existing = await findUserWithPasswordByEmail(profile.email);
  let userId = existing?.id;
  let isNew = false;
  if (existing && !existing.emailVerifiedAt) {
    // Google just proved who owns this email, but whoever registered it never did. They may not be
    // the same person, so their password and sessions stop working before the owner is let in.
    await updatePassword(existing.id, generateToken());
    await destroyAllSessions(existing.id);
    await setEmailVerified(existing.id, true);
  }
  if (!userId) {
    const created = await createUser({ name: profile.name, email: profile.email, password: generateToken(), verified: true });
    userId = created?.id ?? (await findUserWithPasswordByEmail(profile.email))?.id;
    isNew = Boolean(created);
  }
  if (!userId) return fail();

  await createSession(userId);
  return NextResponse.redirect(new URL(isNew ? "/onboarding" : safeNext(expected.next), url));
}
