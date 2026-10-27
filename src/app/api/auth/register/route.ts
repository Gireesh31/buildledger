import { NextResponse } from "next/server";
import { createSession } from "@/lib/server/session";
import { createUser } from "@/lib/server/user-store";
import { PASSWORD_MIN_LENGTH, parseEmail, parseName, parsePassword } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = parseName(body?.name);
  const email = parseEmail(body?.email);
  const password = parsePassword(body?.password);

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!email) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (!password) {
    return NextResponse.json(
      { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const user = await createUser({ name, email, password });
  if (!user) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  await createSession(user.id);
  return NextResponse.json({ user }, { status: 201 });
}
