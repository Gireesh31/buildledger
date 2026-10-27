import { NextResponse } from "next/server";
import { deletePhotoFile, detectImageType, MAX_PHOTO_BYTES, writePhotoFile } from "@/lib/server/avatar-store";
import { getCurrentUser } from "@/lib/server/session";
import { setUserPhoto } from "@/lib/server/user-store";

const signedOut = () => NextResponse.json({ error: "Please sign in." }, { status: 401 });

/** multipart/form-data: photo (JPG, PNG or WebP). Replaces the current profile photo. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return signedOut();

  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  if (file.size > MAX_PHOTO_BYTES) return NextResponse.json({ error: "Photo is too large (max 2 MB)." }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) return NextResponse.json({ error: "Only JPG, PNG or WebP photos are allowed." }, { status: 415 });

  await writePhotoFile(user.id, bytes, type);
  const updated = await setUserPhoto(user.id, type);
  if (!updated) return signedOut();
  return NextResponse.json({ photoUrl: updated.photoUrl });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return signedOut();
  await setUserPhoto(user.id, undefined);
  await deletePhotoFile(user.id);
  return new NextResponse(null, { status: 204 });
}
