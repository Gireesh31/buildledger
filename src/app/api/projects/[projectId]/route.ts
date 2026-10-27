import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/server/access";
import { deleteProjectAndData } from "@/lib/server/project-cleanup";
import { updateProject } from "@/lib/server/project-store";
import { parseProjectFields } from "@/lib/validation";

type Context = RouteContext<"/api/projects/[projectId]">;

export async function GET(_request: Request, { params }: Context) {
  const { projectId } = await params;
  const result = await requireProjectAccess(projectId, "read");
  if (!result.ok) return result.response;
  return NextResponse.json({ ...result.access.project, role: result.access.role });
}

export async function PUT(request: Request, { params }: Context) {
  const { projectId } = await params;
  const result = await requireProjectAccess(projectId, "write");
  if (!result.ok) return result.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  const parsed = parseProjectFields(body, { requireName: false });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  return NextResponse.json(await updateProject(projectId, parsed.fields));
}

export async function DELETE(_request: Request, { params }: Context) {
  const { projectId } = await params;
  const result = await requireProjectAccess(projectId, "owner");
  if (!result.ok) return result.response;

  await deleteProjectAndData(projectId);
  return new NextResponse(null, { status: 204 });
}
