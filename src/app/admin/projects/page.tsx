import { ChevronRight, FolderKanban, Search } from "lucide-react";
import Link from "next/link";
import { buttonClass, inputClass, PageHeader } from "@/components/ui/primitives";
import { formatINR } from "@/lib/format";
import { listAllProjects } from "@/lib/server/admin-store";
import { requireAdminPage } from "@/lib/server/page-data";
import { projectStatuses } from "@/lib/validation";

export default async function AdminProjectsPage({ searchParams }: PageProps<"/admin/projects">) {
  await requireAdminPage("/admin/projects");
  const q = (await searchParams).q;
  const search = typeof q === "string" ? q.slice(0, 100) : "";
  const rows = await listAllProjects(search);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every project. Open one to view and edit its materials, labour, transport, daily log, files, team and settings, the same as its owner."
        icon={FolderKanban}
        accent="blue"
      />
      <form className="mb-4 flex gap-2" role="search">
        <input name="q" defaultValue={search} placeholder="Search by project name or location" className={inputClass} aria-label="Search projects" />
        <button className={buttonClass("secondary")}>
          <Search className="h-4 w-4" aria-hidden /> Search
        </button>
      </form>
      <p className="mb-2 text-xs text-foreground/60">{rows.length === 1 ? "1 project" : `${rows.length} projects`}</p>
      <ul className="divide-y divide-foreground/10 overflow-hidden rounded-xl border border-foreground/[0.07] bg-surface shadow-sm">
        {rows.map(({ project, owner, entries, billed }) => (
          <li key={project.id} className="flex items-center gap-3 px-4 py-3">
            <Link href={`/projects/${project.id}`} className="group flex min-w-0 flex-1 items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium group-hover:text-brand">
                  {project.name}
                  <span className="ml-2 rounded-full bg-foreground/10 px-2 py-0.5 align-middle text-[11px] font-medium text-foreground/60">
                    {projectStatuses.find((s) => s.value === project.status)?.label}
                  </span>
                </p>
                <p className="truncate text-sm text-foreground/60">
                  {project.location || "No location"} · {entries} entries · {formatINR(billed)} billed
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-foreground/40" aria-hidden />
            </Link>
            {owner && (
              <Link href={`/admin/users/${owner.id}`} className="hidden max-w-56 truncate text-right text-xs text-foreground/60 hover:text-brand sm:block" title="Owner">
                {owner.name}
                <br />
                {owner.email}
              </Link>
            )}
          </li>
        ))}
        {rows.length === 0 && <li className="px-4 py-6 text-center text-sm text-foreground/60">No projects found.</li>}
      </ul>
    </>
  );
}
