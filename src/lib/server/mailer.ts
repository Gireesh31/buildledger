/**
 * Sends email through Resend (https://resend.com). Needs RESEND_API_KEY; EMAIL_FROM is the sender
 * (the default only delivers to the Resend account's own address until a domain is verified).
 * Without a key, local development logs the message instead; production never logs it.
 */
export async function sendEmail(message: { to: string; subject: string; text: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "development") console.log(`[mail] To ${message.to}: ${message.subject}\n${message.text}`);
    else console.error("[mail] RESEND_API_KEY is not set; email not sent.");
    return false;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "BuildLedger <onboarding@resend.dev>", ...message }),
  }).catch(() => null);
  if (!response?.ok) console.error(`[mail] Resend refused the email (status ${response?.status ?? "network error"}).`);
  return Boolean(response?.ok);
}

/** The site's own address for links in emails: APP_URL when set, so a forged Host header can't change it. */
export const appUrl = (request: Request) => (process.env.APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
