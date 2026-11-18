import type { User } from "@/lib/types";
import { appUrl, sendEmail } from "./mailer";
import { createEmailVerificationToken } from "./user-store";

/** Emails a "confirm your email" link. Project invites only open once the address is confirmed. */
export async function sendVerificationEmail(user: Pick<User, "id" | "email" | "firstName">, request: Request) {
  const token = await createEmailVerificationToken(user.id);
  return sendEmail({
    to: user.email,
    subject: "Confirm your email for BuildLedger",
    text: `Hi ${user.firstName || "there"},\n\nConfirm this is your email so projects shared with you can open (the link works for 3 days):\n${appUrl(request)}/verify-email?token=${token}\n\nIf you didn't create a BuildLedger account, ignore this email.`,
  });
}
