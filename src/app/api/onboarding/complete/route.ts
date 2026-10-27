import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/session";
import { markOnboarded } from "@/lib/server/user-store";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  await markOnboarded(user.id);
  return new NextResponse(null, { status: 204 });
}
