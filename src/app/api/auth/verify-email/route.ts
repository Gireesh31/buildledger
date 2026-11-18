import { NextResponse } from "next/server";
import { consumeEmailVerificationToken } from "@/lib/server/user-store";

/** The link from the "confirm your email" message: { token }. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const userId = token ? await consumeEmailVerificationToken(token) : null;
  if (!userId) return NextResponse.json({ error: "This link is invalid or has expired. Send a new one from your profile." }, { status: 400 });
  return NextResponse.json({ message: "Email confirmed." });
}
