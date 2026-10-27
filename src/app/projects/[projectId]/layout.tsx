import { Building2, MapPin } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { getProjectAccess } from "@/lib/server/access";
import { getCurrentUser } from "@/lib/server/session";
import { projectStatuses, projectTypes } from "@/lib/validation";

export default function ProjectLayout({ children, params }: LayoutProps<"/projects/[projectId]">) {
  return (
    <>
      <AppHeader />
      <Suspense fallback={<div className="skeleton mx-auto mt-6 h-32 w-full max-w-6xl rounded-3xl" />}>
        <ProjectShell params={params}>{children}</ProjectShell>
      </Suspense>
    </>
  );
}

async function ProjectShell({ params, children }: { params: Promise<{ projectId: string }>; children: React.ReactNode }) {
  const { projectId } = await params;
  if (!(await getCurrentUser())) redirect(`/login?next=/projects/${projectId}`);
  const access = await getProjectAccess(projectId);

  if (!access) {
    return (
      <main className="mx-auto max-w-xl flex-1 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Project not found</h1>
        <p className="mt-2 text-sm text-foreground/60">It may have been deleted, or you don’t have access to it.</p>
      </main>
    );
  }

  const { project, role } = access;
  const type = projectTypes.find((t) => t.value === project.projectType)?.label;
  const status = projectStatuses.find((s) => s.value === project.status)?.label;

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 pt-6">
        <div className="animate-fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-400 px-6 py-6 text-white shadow-lg shadow-orange-500/20">
          <div aria-hidden className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10" />
          <div aria-hidden className="absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm" aria-hidden>
                <Building2 className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
                  {project.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden /> {project.location}
                    </span>
                  )}
                  {type && <span>{type}</span>}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {status && <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">{status}</span>}
              {role === "viewer" && <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">View only</span>}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <ProjectTabs projectId={project.id} />
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
