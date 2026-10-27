import { NextResponse } from "next/server";
import { isTeam } from "@/lib/collections";
import { requireProjectAccess } from "@/lib/server/access";
import { updateProject } from "@/lib/server/project-store";
import { listRecords, setAttendanceForDay } from "@/lib/server/record-store";

const STATUSES = new Set(["present", "half", "absent"]);

/** Replaces the attendance sheet for one date: { date, entries: [{ workerId, status }] }. */
export async function PUT(request: Request, { params }: RouteContext<"/api/projects/[projectId]/attendance">) {
  const { projectId } = await params;
  const result = await requireProjectAccess(projectId, "write");
  if (!result.ok) return result.response;

  const body = await request.json().catch(() => null);
  const date = body?.date;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }
  if (!Array.isArray(body.entries)) return NextResponse.json({ error: "Entries are required." }, { status: 400 });

  // Teams are paid a fixed amount, so only individual workers have attendance.
  const workerIds = new Set((await listRecords("workers", projectId)).filter((w) => !isTeam(w)).map((w) => w.id));
  // One entry per worker per day (the last one wins), so wages can't be counted twice.
  const byWorker = new Map<string, string>();
  for (const entry of body.entries) {
    if (!workerIds.has(entry?.workerId) || !STATUSES.has(entry?.status)) {
      return NextResponse.json({ error: "Invalid attendance entry." }, { status: 400 });
    }
    byWorker.set(entry.workerId, entry.status);
  }
  const entries = [...byWorker].map(([workerId, status]) => ({ workerId, status }));

  await setAttendanceForDay(projectId, date, entries, result.access.user.id);
  await updateProject(projectId, {});
  return NextResponse.json({ date, count: entries.length });
}
