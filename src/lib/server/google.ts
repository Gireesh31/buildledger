/**
 * "Continue with Google" sign-in (OAuth 2.0 authorization code flow), without extra libraries.
 * Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from a Google Cloud "Web application" OAuth client
 * whose authorised redirect URI is <site>/api/auth/google/callback.
 */

export const GOOGLE_STATE_COOKIE = "google_oauth_state";

export function googleConfig(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export const googleRedirectUri = (request: Request) => `${new URL(request.url).origin}/api/auth/google/callback`;

/** Where to send someone after signing in: only paths on this site. */
export const safeNext = (value: string | null | undefined) =>
  value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/";

export interface GoogleProfile {
  email: string;
  name: string;
}

/** Swaps the one-time code for the person's Google profile; null if Google says no or the email isn't verified. */
export async function fetchGoogleProfile(code: string, redirectUri: string): Promise<GoogleProfile | null> {
  const config = googleConfig();
  if (!config) return null;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) return null;
  const { access_token: accessToken } = (await tokenResponse.json()) as { access_token?: string };
  if (!accessToken) return null;

  // The profile comes straight from Google over HTTPS, so it can be trusted without checking a token signature.
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${accessToken}` } });
  if (!profileResponse.ok) return null;
  const profile = (await profileResponse.json()) as { email?: string; email_verified?: boolean; name?: string };
  if (!profile.email || profile.email_verified !== true) return null;
  return { email: profile.email.trim().toLowerCase(), name: profile.name?.trim() || profile.email.split("@")[0] };
}
