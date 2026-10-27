"use client";

import { TeamInvites } from "@/components/team/TeamInvites";
import type { Invite } from "@/lib/types";
import { FinishOnboardingButton } from "./FinishOnboardingButton";

export function InviteTeamStep({ projectId, initialInvites }: { projectId: string; initialInvites: Invite[] }) {
  return (
    <div className="flex flex-col gap-6">
      <TeamInvites projectId={projectId} initialInvites={initialInvites} joinedEmails={[]} canManage />
      <div className="flex items-center justify-between gap-4 border-t border-foreground/10 pt-5">
        <FinishOnboardingButton href={`/projects/${projectId}`}>Skip for now</FinishOnboardingButton>
        <FinishOnboardingButton href={`/projects/${projectId}`} variant="primary">
          Finish and open project
        </FinishOnboardingButton>
      </div>
    </div>
  );
}
