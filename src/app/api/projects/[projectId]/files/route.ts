import { NextResponse } from "next/server";
import { isCollectionName } from "@/lib/collections";
import { requireProjectAccess } from "@/lib/server/access";
import { ALLOWED_MIME_TYPES, listAttachments, MAX_UPLOAD_BYTES, saveAttachment } from "@/lib/server/attachment-store";
import { recordExists } from "@/lib/server/record-store";
import type { AttachmentKind } from "@/lib/types";

type Context = RouteContext<"/api/projects/[projectId]/files">;

const KINDS = new Set<AttachmentKind>(["bill", "photo", "document"]);

export async function GET(_request: Request, { params }: Context) {
  const { projectId } = await params;
  const result = await requireProjectAccess(projectId, "read");
  if (!result.ok) return result.response;
  return NextResponse.json(await listAttachments(projectId));
}

/** multipart/form-data: file, kind, optional collection + recordId to link it, optional caption. */
export async function POST(request: Request, { params }: Context) {
  const { projectId } = await params;
  const result = await requireProjectAccess(projectId, "write");
  if (!result.ok) return result.response;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File is too large (max 10 MB)." }, { status: 413 });
  }
  if (!ALLOWED_MIME_TYPES[file.type]) {
    return NextResponse.json({ error: "Only JPG, PNG, WebP, HEIC images and PDFs are allowed." }, { status: 415 });
  }

  const kind = String(form?.get("kind") ?? "document") as AttachmentKind;
  if (!KINDS.has(kind)) return NextResponse.json({ error: "Invalid file type." }, { status: 400 });

  const collection = form?.get("collection");
  const recordId = form?.get("recordId");
  if (collection || recordId) {
    if (!isCollectionName(collection) || typeof recordId !== "string" || !(await recordExists(collection, projectId, recordId))) {
      return NextResponse.json({ error: "The linked record doesn't exist." }, { status: 400 });
    }
  }

  const attachment = await saveAttachment({
    projectId,
    kind,
    file,
    uploadedBy: result.access.user.id,
    collection: typeof collection === "string" ? collection : undefined,
    recordId: typeof recordId === "string" ? recordId : undefined,
    caption: typeof form?.get("caption") === "string" ? String(form?.get("caption")) : undefined,
  });
  return NextResponse.json(attachment, { status: 201 });
}
