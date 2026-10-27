import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/server/access";
import { deleteInvite } from "@/lib/server/invite-store";

export async function DELETE(_request: Request, { params }: RouteContext<"/api/projects/[projectId]/invites/[inviteId]">) {
  const { projectId, inviteId } = await params;
  const result = await requireProjectAccess(projectId, "owner");
  if (!result.ok) return result.response;
  return (await deleteInvite(projectId, inviteId))
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: "Invite not found." }, { status: 404 });
}
