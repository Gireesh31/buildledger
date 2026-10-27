import { NextResponse } from "next/server";
import { listAccessibleProjects } from "@/lib/server/access";
import { createProject } from "@/lib/server/project-store";
import { getCurrentUser } from "@/lib/server/session";
import { parseProjectFields } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  return NextResponse.json(await listAccessibleProjects(user));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  const parsed = parseProjectFields(body, { requireName: true });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const project = await createProject({ ...parsed.fields, name: parsed.fields.name! }, user.id);
  return NextResponse.json(project, { status: 201 });
}
