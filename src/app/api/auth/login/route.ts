import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/server/crypto";
import { clientIp, limits, rateLimit } from "@/lib/server/rate-limit";
import { createSession } from "@/lib/server/session";
import { findUserWithPasswordByEmail } from "@/lib/server/user-store";
import { parseEmail } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = parseEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";

  // Before checking the password, so guesses stop counting once the limit is reached.
  const ip = clientIp(request);
  const limited = await rateLimit(limits.loginByIp(ip), ...(email ? [limits.loginByEmail(email)] : []));
  if (limited) return limited;

  const user = email ? await findUserWithPasswordByEmail(email) : undefined;
  // Same message for unknown email and wrong password, so accounts can't be enumerated.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (user.disabledAt) {
    return NextResponse.json({ error: "This account has been disabled. Contact BuildLedger support." }, { status: 403 });
  }

  const token = await createSession(user.id);
  // Only the mobile app asks for the token; the website keeps it in an httpOnly cookie that page scripts can't read.
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email }, ...(body?.client === "mobile" && { token }) });
}
