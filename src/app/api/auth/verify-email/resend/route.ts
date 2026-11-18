import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/server/email-verification";
import { getCurrentUser } from "@/lib/server/session";

/** Sends the signed-in user a fresh "confirm your email" link. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (user.emailVerifiedAt) return NextResponse.json({ message: "Your email is already confirmed." });
  const sent = await sendVerificationEmail(user, request);
  if (!sent) return NextResponse.json({ error: "Couldn't send the email right now. Please try again later." }, { status: 503 });
  return NextResponse.json({ message: `We sent a link to ${user.email}.` });
}
