import { NextResponse } from "next/server";
import { ANNOUNCEMENT_MEDIA_TYPES } from "@/lib/app-config";
import { requireAdmin } from "@/lib/server/access";
import { createMediaUpload } from "@/lib/server/app-settings";

/**
 * Starts an image or video upload for an announcement: { contentType, size }.
 * Returns a one-time URL the admin's browser or app PUTs the file to, straight into storage
 * (videos are too big to pass through this server), plus the file's path and public URL.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const body = await request.json().catch(() => null);
  const contentType = typeof body?.contentType === "string" ? body.contentType.toLowerCase() : "";
  const kind = ANNOUNCEMENT_MEDIA_TYPES[contentType];
  if (!kind) return NextResponse.json({ error: "Use a JPG, PNG, WebP or GIF image, or an MP4, MOV or WebM video." }, { status: 400 });
  const size = Number(body?.size);
  if (!Number.isFinite(size) || size <= 0 || size > kind.maxBytes) {
    return NextResponse.json({ error: `${kind.type === "video" ? "Videos" : "Images"} can be up to ${kind.maxBytes / 1024 / 1024} MB.` }, { status: 400 });
  }
  const upload = await createMediaUpload(contentType);
  return upload ? NextResponse.json(upload, { status: 201 }) : NextResponse.json({ error: "Unsupported file." }, { status: 400 });
}
