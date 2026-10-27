import { notFound } from "next/navigation";
import { InviteTeamStep } from "@/components/onboarding/InviteTeamStep";
import { getProjectAccess } from "@/lib/server/access";
import { listInvites } from "@/lib/server/invite-store";

export default async function InviteTeamPage({ params }: PageProps<"/onboarding/[projectId]/invite">) {
  const { projectId } = await params;
  const [access, invites] = await Promise.all([getProjectAccess(projectId), listInvites(projectId)]);
  if (access?.role !== "owner") notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invite your team</h1>
        <p className="mt-1 text-foreground/60">
          Give your engineer, supervisor or partners access to {access.project.name}. You can skip this and do it later.
        </p>
      </div>
      <InviteTeamStep projectId={projectId} initialInvites={invites} />
    </div>
  );
}
