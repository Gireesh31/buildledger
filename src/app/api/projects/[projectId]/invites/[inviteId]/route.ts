import { NextResponse } from "next/server";
import { featureOff } from "@/lib/server/app-settings";
import { requireProjectAccess } from "@/lib/server/access";
import { deleteInvite } from "@/lib/server/invite-store";

export async function DELETE(_request: Request, { params }: RouteContext<"/api/projects/[projectId]/invites/[inviteId]">) {
  const { projectId, inviteId } = await params;
  const result = await requireProjectAccess(projectId, "owner");
  if (!result.ok) return result.response;
  const off = await featureOff("team");
  if (off) return off;
  return (await deleteInvite(projectId, inviteId))
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: "Invite not found." }, { status: 404 });
}
