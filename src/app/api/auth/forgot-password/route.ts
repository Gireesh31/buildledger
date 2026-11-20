import { NextResponse } from "next/server";
import { appUrl, sendEmail } from "@/lib/server/mailer";
import { clientIp, limits, rateLimit } from "@/lib/server/rate-limit";
import { createResetToken, findUserWithPasswordByEmail } from "@/lib/server/user-store";
import { parseEmail } from "@/lib/validation";

const MESSAGE = "If an account exists for that email, a reset link has been sent.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = parseEmail(body?.email);
  if (!email) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  // Counted for every address, account or not, so the limit says nothing about who has one.
  const limited = await rateLimit(limits.resetEmailByIp(clientIp(request)), limits.resetEmailByEmail(email));
  if (limited) return limited;

  const user = await findUserWithPasswordByEmail(email);
  if (!user) return NextResponse.json({ message: MESSAGE });

  const token = await createResetToken(user.id);
  // The link goes only to the account's mailbox: never into the response, and never into production logs.
  await sendEmail({
    to: email,
    subject: "Reset your BuildLedger password",
    text: `Someone asked to reset the password for your BuildLedger account.\n\nSet a new password (the link works for 1 hour):\n${appUrl(request)}/reset-password?token=${token}\n\nIf this wasn't you, ignore this email.`,
  });
  return NextResponse.json({ message: MESSAGE });
}
