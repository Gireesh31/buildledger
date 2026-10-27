import { db } from "./supabase";

// Profile photos live in the private "avatars" Storage bucket, one object per user id.
const BUCKET = "avatars";

// The browser shrinks photos to a small square before uploading, so this is generous.
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/** Checks the file's first bytes, not just its claimed type, so only real images are stored. */
export function detectImageType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function writePhotoFile(userId: string, bytes: Uint8Array, contentType: string) {
  const { error } = await (await db()).storage.from(BUCKET).upload(userId, bytes, { contentType, upsert: true });
  if (error) throw new Error(`Couldn't store the photo: ${error.message}`);
}

export async function readPhotoFile(userId: string): Promise<Buffer | null> {
  const { data, error } = await (await db()).storage.from(BUCKET).download(userId);
  return error || !data ? null : Buffer.from(await data.arrayBuffer());
}

export async function deletePhotoFile(userId: string) {
  await (await db()).storage.from(BUCKET).remove([userId]);
}
