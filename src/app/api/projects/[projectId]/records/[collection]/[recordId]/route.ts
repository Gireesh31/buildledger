import { NextResponse } from "next/server";
import { isCollectionName } from "@/lib/collections";
import { requireProjectAccess } from "@/lib/server/access";
import { updateProject } from "@/lib/server/project-store";
import { deleteRecord, recordExists, replaceRecord } from "@/lib/server/record-store";
import { parseRecord } from "@/lib/validation";

type Context = RouteContext<"/api/projects/[projectId]/records/[collection]/[recordId]">;

const notFound = (what: string) => NextResponse.json({ error: `${what} not found.` }, { status: 404 });

export async function PUT(request: Request, { params }: Context) {
  const { projectId, collection, recordId } = await params;
  if (!isCollectionName(collection)) return notFound("Collection");
  const result = await requireProjectAccess(projectId, "write");
  if (!result.ok) return result.response;

  const body = await request.json().catch(() => null);
  const parsed = await parseRecord(collection, body, (ref, id) => recordExists(ref, projectId, id));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const record = await replaceRecord(collection, projectId, recordId, parsed.values);
  if (!record) return notFound("Record");
  await updateProject(projectId, {});
  return NextResponse.json(record);
}

export async function DELETE(_request: Request, { params }: Context) {
  const { projectId, collection, recordId } = await params;
  if (!isCollectionName(collection)) return notFound("Collection");
  const result = await requireProjectAccess(projectId, "write");
  if (!result.ok) return result.response;

  if (!(await deleteRecord(collection, projectId, recordId))) return notFound("Record");
  await updateProject(projectId, {});
  return new NextResponse(null, { status: 204 });
}
