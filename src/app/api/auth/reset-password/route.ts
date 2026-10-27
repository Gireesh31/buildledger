import { NextResponse } from "next/server";
import { destroyAllSessions } from "@/lib/server/session";
import { consumeResetToken, updatePassword } from "@/lib/server/user-store";
import { PASSWORD_MIN_LENGTH, parsePassword } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = parsePassword(body?.password);

  if (!password) {
    return NextResponse.json(
      { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const userId = token ? await consumeResetToken(token) : null;
  if (!userId) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  await updatePassword(userId, password);
  await destroyAllSessions(userId);
  return NextResponse.json({ message: "Password updated. You can now sign in." });
}
