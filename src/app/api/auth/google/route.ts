import { NextResponse } from "next/server";
import { generateToken } from "@/lib/server/crypto";
import { GOOGLE_STATE_COOKIE, googleConfig, googleRedirectUri, safeNext } from "@/lib/server/google";

/** Sends the browser to Google's sign-in page. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const config = googleConfig();
  if (!config) return NextResponse.redirect(new URL("/login?error=google-unavailable", url));

  // A random state ties Google's reply to this browser, so a forged reply can't sign someone in.
  const state = generateToken();
  const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  google.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: googleRedirectUri(request),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();

  const response = NextResponse.redirect(google);
  response.cookies.set(GOOGLE_STATE_COOKIE, JSON.stringify({ state, next: safeNext(url.searchParams.get("next")) }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
