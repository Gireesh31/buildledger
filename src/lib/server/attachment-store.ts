import type { Attachment, AttachmentKind } from "@/lib/types";
import { db, iso, isUuid, must } from "./supabase";

// Files live in the private "uploads" Storage bucket; their details in the `attachments` table.
const BUCKET = "uploads";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "application/pdf": ".pdf",
};

interface AttachmentRow {
  id: string;
  project_id: string;
  kind: AttachmentKind;
  file_name: string;
  mime_type: string;
  size: number;
  collection: string | null;
  record_id: string | null;
  caption: string | null;
  uploaded_by: string | null;
  created_at: string;
}

const fromRow = (row: AttachmentRow): Attachment => ({
  id: row.id,
  projectId: row.project_id,
  kind: row.kind,
  fileName: row.file_name,
  mimeType: row.mime_type,
  size: Number(row.size),
  ...(row.collection && { collection: row.collection }),
  ...(row.record_id && { recordId: row.record_id }),
  ...(row.caption && { caption: row.caption }),
  uploadedBy: row.uploaded_by ?? "",
  createdAt: iso(row.created_at)!,
});

// Stored under a generated id, never the client-supplied name, so paths can't be manipulated.
const objectPath = (a: Pick<Attachment, "id" | "projectId" | "mimeType">) => `${a.projectId}/${a.id}${ALLOWED_MIME_TYPES[a.mimeType] ?? ""}`;

export async function listAttachments(projectId: string): Promise<Attachment[]> {
  if (!isUuid(projectId)) return [];
  const rows = must(
    await (await db()).from("attachments").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
  ) as AttachmentRow[];
  return rows.map(fromRow);
}

export async function getAttachment(projectId: string, id: string): Promise<Attachment | undefined> {
  if (!isUuid(projectId) || !isUuid(id)) return undefined;
  const row = must(await (await db()).from("attachments").select("*").eq("id", id).eq("project_id", projectId).maybeSingle<AttachmentRow>());
  return row ? fromRow(row) : undefined;
}

export async function readAttachmentFile(attachment: Attachment): Promise<Buffer> {
  const { data, error } = await (await db()).storage.from(BUCKET).download(objectPath(attachment));
  if (error || !data) throw new Error(`Couldn't read the file: ${error?.message ?? "missing"}`);
  return Buffer.from(await data.arrayBuffer());
}

export async function saveAttachment(input: {
  projectId: string;
  kind: AttachmentKind;
  file: File;
  uploadedBy: string;
  collection?: string;
  recordId?: string;
  caption?: string;
}): Promise<Attachment> {
  const client = await db();
  const id = crypto.randomUUID();
  const path = objectPath({ id, projectId: input.projectId, mimeType: input.file.type });
  const upload = await client.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await input.file.arrayBuffer()), { contentType: input.file.type, upsert: false });
  if (upload.error) throw new Error(`Couldn't store the file: ${upload.error.message}`);

  const { data, error } = await client
    .from("attachments")
    .insert({
      id,
      project_id: input.projectId,
      kind: input.kind,
      file_name: input.file.name.slice(0, 200) || "upload",
      mime_type: input.file.type,
      size: input.file.size,
      collection: input.collection ?? null,
      record_id: input.recordId ?? null,
      caption: input.caption?.slice(0, 200) ?? null,
      uploaded_by: input.uploadedBy,
    })
    .select("*")
    .single<AttachmentRow>();
  if (error) {
    // Don't leave an orphaned file behind if the row couldn't be saved.
    await client.storage.from(BUCKET).remove([path]);
    must({ data, error });
  }
  return fromRow(data!);
}

export async function deleteAttachment(projectId: string, id: string): Promise<boolean> {
  if (!isUuid(projectId) || !isUuid(id)) return false;
  const client = await db();
  const rows = must(await client.from("attachments").delete().eq("id", id).eq("project_id", projectId).select("*")) as AttachmentRow[];
  if (rows.length === 0) return false;
  await client.storage.from(BUCKET).remove([objectPath(fromRow(rows[0]))]);
  return true;
}

export async function deleteProjectAttachments(projectId: string) {
  if (!isUuid(projectId)) return;
  const client = await db();
  const rows = must(await client.from("attachments").delete().eq("project_id", projectId).select("*")) as AttachmentRow[];
  if (rows.length > 0) await client.storage.from(BUCKET).remove(rows.map((row) => objectPath(fromRow(row))));
}
