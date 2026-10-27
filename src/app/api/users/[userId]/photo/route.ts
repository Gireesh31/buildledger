import { NextResponse } from "next/server";
import { readPhotoFile } from "@/lib/server/avatar-store";
import { getCurrentUser } from "@/lib/server/session";
import { findUserPhotoType } from "@/lib/server/user-store";

type Context = RouteContext<"/api/users/[userId]/photo">;

/** A user's profile photo, for any signed-in user. URLs carry a version, so they can be cached for long. */
export async function GET(_request: Request, { params }: Context) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { userId } = await params;

  const type = await findUserPhotoType(userId);
  const bytes = type && (await readPhotoFile(userId));
  if (!type || !bytes) return NextResponse.json({ error: "No photo." }, { status: 404 });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
