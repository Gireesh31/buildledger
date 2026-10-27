import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/server/crypto";
import { createSession } from "@/lib/server/session";
import { findUserWithPasswordByEmail } from "@/lib/server/user-store";
import { parseEmail } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = parseEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";

  const user = email ? await findUserWithPasswordByEmail(email) : undefined;
  // Same message for unknown email and wrong password, so accounts can't be enumerated.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
}
