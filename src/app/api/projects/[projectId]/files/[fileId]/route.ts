import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/server/access";
import { deleteAttachment, getAttachment, readAttachmentFile } from "@/lib/server/attachment-store";

type Context = RouteContext<"/api/projects/[projectId]/files/[fileId]">;

export async function GET(request: Request, { params }: Context) {
  const { projectId, fileId } = await params;
  const result = await requireProjectAccess(projectId, "read");
  if (!result.ok) return result.response;

  const attachment = await getAttachment(projectId, fileId);
  if (!attachment) return NextResponse.json({ error: "File not found." }, { status: 404 });

  const download = new URL(request.url).searchParams.has("download");
  const fileName = encodeURIComponent(attachment.fileName);
  return new NextResponse(new Uint8Array(await readAttachmentFile(attachment)), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${fileName}`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { projectId, fileId } = await params;
  const result = await requireProjectAccess(projectId, "write");
  if (!result.ok) return result.response;
  return (await deleteAttachment(projectId, fileId))
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: "File not found." }, { status: 404 });
}
