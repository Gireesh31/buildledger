import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/access";
import { parseAnnouncement } from "@/lib/server/announcement-input";
import { createAnnouncement, listAllAnnouncements } from "@/lib/server/app-settings";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  return NextResponse.json(await listAllAnnouncements());
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const parsed = parseAnnouncement(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  return NextResponse.json(await createAnnouncement(parsed.input, admin.user.id), { status: 201 });
}
