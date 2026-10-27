import { Settings } from "lucide-react";
import type { Metadata } from "next";
import { DeleteProjectButton } from "@/components/projects/DeleteProjectButton";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Card, PageHeader } from "@/components/ui/primitives";
import { canWrite } from "@/lib/server/access";
import { requirePageAccess } from "@/lib/server/page-data";

export const metadata: Metadata = { title: "Project settings" };

export default async function SettingsPage({ params }: PageProps<"/projects/[projectId]/settings">) {
  const { projectId } = await params;
  const { project, role } = await requirePageAccess(projectId);

  return (
    <>
      <PageHeader icon={Settings} accent="orange" title="Project settings" />
      <div className="flex max-w-2xl flex-col gap-6">
        <Card title="Details">
          {canWrite(role) ? (
            <ProjectForm project={project} />
          ) : (
            <p className="text-sm text-foreground/60">You have view-only access to this project.</p>
          )}
        </Card>
        {role === "owner" && (
          <Card title="Danger zone">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-foreground/70">Delete this project and everything recorded in it.</p>
              <DeleteProjectButton projectId={project.id} projectName={project.name} />
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
