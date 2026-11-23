import { NextResponse } from "next/server";
import { listLiveAnnouncements } from "@/lib/server/app-settings";
import { getCurrentUser } from "@/lib/server/session";

/** Announcements, new features and offers that are live now, for signed-in users. */
export async function GET() {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  return NextResponse.json(await listLiveAnnouncements());
}
