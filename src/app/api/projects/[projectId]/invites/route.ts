import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/server/access";
import { createInvites, listInvites } from "@/lib/server/invite-store";
import { parseEmail, parseInviteRole } from "@/lib/validation";

type Context = RouteContext<"/api/projects/[projectId]/invites">;

const MAX_INVITES_PER_REQUEST = 20;

export async function GET(_request: Request, { params }: Context) {
  const { projectId } = await params;
  const result = await requireProjectAccess(projectId, "read");
  if (!result.ok) return result.response;
  return NextResponse.json(await listInvites(projectId));
}

export async function POST(request: Request, { params }: Context) {
  const { projectId } = await params;
  const result = await requireProjectAccess(projectId, "owner");
  if (!result.ok) return result.response;
  const { user, project } = result.access;

  const body = await request.json().catch(() => null);
  const role = parseInviteRole(body?.role);
  if (!role) return NextResponse.json({ error: "Role must be editor or viewer." }, { status: 400 });

  const rawEmails: unknown[] = Array.isArray(body?.emails) ? body.emails : [];
  if (rawEmails.length === 0 || rawEmails.length > MAX_INVITES_PER_REQUEST) {
    return NextResponse.json(
      { error: `Add between 1 and ${MAX_INVITES_PER_REQUEST} email addresses.` },
      { status: 400 },
    );
  }
  const emails = rawEmails.map(parseEmail);
  const invalid = rawEmails.filter((_, i) => !emails[i]);
  if (invalid.length > 0) {
    return NextResponse.json({ error: `Invalid email: ${String(invalid[0])}` }, { status: 400 });
  }

  const created = await createInvites({
    projectId,
    emails: (emails as string[]).filter((email) => email !== user.email),
    role,
    invitedBy: user.id,
  });

  // No email service yet: log the invites. Replace with a real mailer before going live.
  for (const invite of created) {
    console.log(`[invite] ${user.email} invited ${invite.email} to "${project.name}" as ${invite.role}`);
  }

  return NextResponse.json(created, { status: 201 });
}
