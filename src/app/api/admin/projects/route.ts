import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/access";
import { listAllProjects } from "@/lib/server/admin-store";

/** Every project with its owner. Admins open and edit a project through the normal project pages and API. */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const search = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json(await listAllProjects(search.slice(0, 100)));
}
