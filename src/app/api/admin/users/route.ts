import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/access";
import { listAllUsers } from "@/lib/server/user-store";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const search = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json(await listAllUsers(search.slice(0, 100)));
}
