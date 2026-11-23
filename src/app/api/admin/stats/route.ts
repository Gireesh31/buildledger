import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/access";
import { getAdminStats } from "@/lib/server/admin-store";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  return NextResponse.json(await getAdminStats());
}
