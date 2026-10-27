import { NextResponse } from "next/server";
import { isCollectionName } from "@/lib/collections";
import { requireProjectAccess } from "@/lib/server/access";
import { updateProject } from "@/lib/server/project-store";
import { createRecord, listRecords, recordExists } from "@/lib/server/record-store";
import { parseRecord } from "@/lib/validation";

type Context = RouteContext<"/api/projects/[projectId]/records/[collection]">;

const unknownCollection = () => NextResponse.json({ error: "Unknown collection." }, { status: 404 });

export async function GET(_request: Request, { params }: Context) {
  const { projectId, collection } = await params;
  if (!isCollectionName(collection)) return unknownCollection();
  const result = await requireProjectAccess(projectId, "read");
  if (!result.ok) return result.response;
  return NextResponse.json(await listRecords(collection, projectId));
}

export async function POST(request: Request, { params }: Context) {
  const { projectId, collection } = await params;
  if (!isCollectionName(collection)) return unknownCollection();
  const result = await requireProjectAccess(projectId, "write");
  if (!result.ok) return result.response;

  const body = await request.json().catch(() => null);
  const parsed = await parseRecord(collection, body, (ref, id) => recordExists(ref, projectId, id));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const record = await createRecord(collection, projectId, result.access.user.id, parsed.values);
  await updateProject(projectId, {}); // bump updatedAt so the dashboard shows recent activity first
  return NextResponse.json(record, { status: 201 });
}
