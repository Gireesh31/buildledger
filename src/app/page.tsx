import {
  ArrowRight,
  Building2,
  FolderKanban,
  PiggyBank,
  Plus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { HeroSkyline } from "@/components/landing/HeroSkyline";
import { Landing } from "@/components/landing/Landing";
import { SiteLoader } from "@/components/ui/SiteLoader";
import { AppHeader } from "@/components/layout/AppHeader";
import { BudgetMeter, buttonClass, EmptyState, IconChip, stagger, StatTile, type Accent } from "@/components/ui/primitives";
import { formatINR, formatINRCompact } from "@/lib/format";
import { computeLedger, LEDGER_COLLECTIONS } from "@/lib/ledger";
import { listAccessibleProjects } from "@/lib/server/access";
import { loadRecords } from "@/lib/server/record-store";
import { getCurrentUser } from "@/lib/server/session";
import type { User } from "@/lib/types";
import { projectStatuses } from "@/lib/validation";

export default function Home() {
  return (
    <>
      <AppHeader />
      <Suspense fallback={<DashboardSkeleton />}>
        <HomeContent />
      </Suspense>
    </>
  );
}

async function HomeContent() {
  const user = await getCurrentUser();
  return user ? <Dashboard user={user} /> : <Landing />;
}

function DashboardSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="skeleton mb-6 h-8 w-64 rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
      <SiteLoader className="mt-12" label="Loading your sites…" />
    </main>
  );
}

const STATUS_STYLES: Record<string, string> = {
  planning: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "on-hold": "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  completed: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};

async function Dashboard({ user }: { user: User }) {
  const accessible = await listAccessibleProjects(user);
  const rows = await Promise.all(
    accessible.map(async ({ project, role }) => {
      const records = await loadRecords(project.id, LEDGER_COLLECTIONS);
      return { project, role, ledger: computeLedger({ project, ...records }) };
    }),
  );
  const totals = rows.reduce(
    (acc, { ledger }) => ({
      spent: acc.spent + ledger.totalCost,
      budget: acc.budget + ledger.budget,
      due: acc.due + ledger.workerDueTotal,
    }),
    { spent: 0, budget: 0, due: 0 },
  );
  const active = rows.filter((r) => r.project.status === "active").length;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="animate-fade-up relative mb-8 flex flex-wrap items-end justify-between gap-3 overflow-hidden rounded-2xl border border-foreground/[0.08] bg-surface px-5 pb-[165px] pt-6 shadow-card sm:px-7 sm:pb-[170px]">
        <HeroSkyline className="absolute inset-x-0 bottom-0 h-[170px] w-full" phoneClassName="absolute inset-x-0 bottom-0 h-[160px] w-full" />
        {/* Greeting and button sit above the skyline band. */}
        <div className="relative">
          <p className="text-sm font-medium text-brand">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight">Namaste, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-foreground/60">Here’s where your sites stand today.</p>
        </div>
        <Link href="/projects/new" className={`${buttonClass("primary")} relative`}>
          <Plus className="h-4 w-4" /> New project
        </Link>
      </div>

      <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile index={0} icon={FolderKanban} accent="orange" label="Projects" value={String(rows.length)} hint={`${active} in progress`} />
        <StatTile index={1} icon={Wallet} accent="blue" label="Total spent" value={formatINR(totals.spent)} hint="Materials + labour + transport" />
        <StatTile index={2} icon={PiggyBank} accent="green" label="Total budget" value={formatINR(totals.budget)} />
        <StatTile
          index={3}
          icon={Users}
          accent="rose"
          label="Owed to workers"
          value={formatINR(totals.due)}
          hint="Wages and team amounts not yet paid"
          tone={totals.due > 0 ? "critical" : undefined}
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold">Your projects</h2>
      {rows.length === 0 ? (
        <EmptyState>
          <p className="mb-3">No projects yet.</p>
          <Link href="/projects/new" className={buttonClass("primary")}>
            <Plus className="h-4 w-4" /> Create your first project
          </Link>
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ project, role, ledger }, i) => (
            <li key={project.id} className="animate-fade-up min-w-0" style={stagger(i, 70)}>
              <Link
                href={`/projects/${project.id}`}
                className="lift group relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-foreground/[0.07] bg-surface p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <IconChip icon={Building2} accent={(["orange", "green", "violet", "rose"] as Accent[])[i % 4]} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{project.name}</p>
                      <p className="truncate text-xs text-foreground/60">{project.location || "No location"}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[project.status] ?? ""}`}>
                    {projectStatuses.find((s) => s.value === project.status)?.label}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-lg font-semibold">{formatINR(ledger.totalCost)}</span>
                  <span className="text-xs text-foreground/60">{ledger.budget > 0 ? `of ${formatINRCompact(ledger.budget)}` : "spent"}</span>
                </div>
                <BudgetMeter used={ledger.totalCost} budget={ledger.budget} />
                <div className="mt-auto flex items-center justify-between text-xs text-foreground/50">
                  <span>{role !== "owner" ? `Shared with you · ${role}` : "Owner"}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:text-brand" aria-hidden />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
