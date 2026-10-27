import { UsersRound } from "lucide-react";
import type { Metadata } from "next";
import { TeamInvites } from "@/components/team/TeamInvites";
import { Card, PageHeader } from "@/components/ui/primitives";
import { listInvites } from "@/lib/server/invite-store";
import { requirePageAccess } from "@/lib/server/page-data";
import { findRegisteredEmails, findUserById } from "@/lib/server/user-store";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage({ params }: PageProps<"/projects/[projectId]/team">) {
  const { projectId } = await params;
  const { project, role } = await requirePageAccess(projectId);
  const [owner, invites] = await Promise.all([findUserById(project.ownerId), listInvites(projectId)]);
  const joinedEmails = await findRegisteredEmails(invites.map((i) => i.email));

  return (
    <>
      <PageHeader icon={UsersRound} accent="blue" title="Team" description="People who can see this project. Editors can add entries; viewers can only look and export." />
      <div className="flex max-w-2xl flex-col gap-6">
        <Card title="Owner">
          <p className="text-sm">
            {owner?.name ?? "Unknown"} <span className="text-foreground/60">· {owner?.email}</span>
          </p>
        </Card>
        <Card title="Members">
          {invites.length === 0 && role !== "owner" ? (
            <p className="text-sm text-foreground/60">No other members.</p>
          ) : (
            <TeamInvites projectId={projectId} initialInvites={invites} joinedEmails={joinedEmails} canManage={role === "owner"} />
          )}
          <p className="mt-4 text-xs text-foreground/50">
            Invites aren’t emailed yet. Tell people to sign up or sign in with the invited email address to get access.
          </p>
        </Card>
      </div>
    </>
  );
}
