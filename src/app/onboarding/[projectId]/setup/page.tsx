import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { getProjectAccess } from "@/lib/server/access";

export default async function ProjectSetupPage({ params }: PageProps<"/onboarding/[projectId]/setup">) {
  const { projectId } = await params;
  const access = await getProjectAccess(projectId);
  if (access?.role !== "owner") notFound();
  const { project } = access;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Budget and timeline for {project.name}</h1>
        <p className="mt-1 text-foreground/60">All optional. These let BuildLedger show budget used and cost per sq ft.</p>
      </div>
      <ProjectForm
        project={project}
        fields={["budget", "areaSqft", "startDate", "endDate", "status"]}
        submitLabel="Continue"
        redirectTo="/onboarding/:id/invite"
      />
    </div>
  );
}
