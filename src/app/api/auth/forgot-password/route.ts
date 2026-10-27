import { NextResponse } from "next/server";
import { createResetToken, findUserWithPasswordByEmail } from "@/lib/server/user-store";
import { parseEmail } from "@/lib/validation";

const MESSAGE = "If an account exists for that email, a reset link has been sent.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = parseEmail(body?.email);
  if (!email) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const user = await findUserWithPasswordByEmail(email);
  if (!user) return NextResponse.json({ message: MESSAGE });

  const token = await createResetToken(user.id);
  const resetUrl = `${new URL(request.url).origin}/reset-password?token=${token}`;

  // No email service yet: log the link. Replace with a real mailer before going live.
  console.log(`[auth] Password reset link for ${email}: ${resetUrl}`);

  return NextResponse.json({
    message: MESSAGE,
    // Exposed in development only, so the flow can be tested without email.
    ...(process.env.NODE_ENV !== "production" && { resetUrl }),
  });
}
