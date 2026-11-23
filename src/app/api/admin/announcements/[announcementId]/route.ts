import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/access";
import { parseAnnouncement } from "@/lib/server/announcement-input";
import { deleteAnnouncement, updateAnnouncement } from "@/lib/server/app-settings";

type Context = RouteContext<"/api/admin/announcements/[announcementId]">;
const notFound = () => NextResponse.json({ error: "Announcement not found." }, { status: 404 });

export async function PUT(request: Request, { params }: Context) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const { announcementId } = await params;
  const parsed = parseAnnouncement(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const updated = await updateAnnouncement(announcementId, parsed.input);
  return updated ? NextResponse.json(updated) : notFound();
}

export async function DELETE(_request: Request, { params }: Context) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const { announcementId } = await params;
  return (await deleteAnnouncement(announcementId)) ? NextResponse.json({ ok: true }) : notFound();
}
