import {
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  FolderKanban,
  IndianRupee,
  Package,
  PiggyBank,
  Plus,
  Smartphone,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
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
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    </main>
  );
}

const STATUS_STYLES: Record<string, string> = {
  planning: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "on-hold": "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  completed: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};

const CARD_BARS = ["from-orange-500 to-amber-400", "from-teal-500 to-sky-500", "from-violet-500 to-fuchsia-400", "from-rose-500 to-orange-400"];

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
      <div className="animate-fade-up mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight">Namaste, {user.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-sm text-foreground/60">Here’s where your sites stand today.</p>
        </div>
        <Link href="/projects/new" className={buttonClass("primary")}>
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
                className="lift group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-foreground/[0.07] bg-surface p-5 shadow-sm"
              >
                <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${CARD_BARS[i % CARD_BARS.length]}`} aria-hidden />
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

const features: { icon: typeof Package; accent: Accent; title: string; body: string }[] = [
  { icon: Package, accent: "orange", title: "Material purchases", body: "Log cement, steel, sand and more by quantity and rate. The total is worked out for you." },
  { icon: Camera, accent: "blue", title: "Scan the bill", body: "Take a photo of the bill and the form fills itself: material, quantity, rate and date." },
  { icon: Smartphone, accent: "violet", title: "Made for the site", body: "Works on your phone. Add several materials or vehicles in one go and see what you still owe." },
  { icon: Users, accent: "green", title: "Labour & attendance", body: "Daily attendance for workers, fixed amounts for teams, and who you still owe." },
  { icon: Truck, accent: "amber", title: "Transport & machinery", body: "JCB, crane, truck or tractor: pick it, set hours or a full amount, done." },
  { icon: TrendingUp, accent: "rose", title: "Reports", body: "Budget vs actual, spend by material and month, cost per sq ft, PDF downloads." },
];

function Landing() {
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden">
        {/* Soft colour blobs behind the hero. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="animate-float absolute -left-24 -top-24 h-80 w-80 rounded-full bg-orange-400/25 blur-3xl" />
          <div className="animate-float absolute -right-20 top-10 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl [animation-delay:-3s]" />
          <div className="animate-float absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-300/25 blur-3xl [animation-delay:-5s]" />
        </div>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
          <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
            <IndianRupee className="h-3.5 w-3.5" /> Construction cost tracking for Indian sites
          </p>
          <h1 className="animate-fade-up mt-5 text-4xl font-semibold tracking-tight sm:text-6xl" style={stagger(1, 90)}>
            Know where every{" "}
            <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-teal-500 bg-clip-text text-transparent">rupee on site</span> goes.
          </h1>
          <p className="animate-fade-up mx-auto mt-5 max-w-2xl text-foreground/70" style={stagger(2, 90)}>
            BuildLedger keeps materials, labour, transport and daily progress for each project in one place, so you always know what you’ve
            spent, what you owe and how much budget is left.
          </p>
          <div className="animate-fade-up mt-8 flex flex-wrap justify-center gap-3" style={stagger(3, 90)}>
            <Link href="/register" className={buttonClass("primary")}>
              Create free account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className={buttonClass("secondary")}>
              Sign in
            </Link>
          </div>
          <ul className="animate-fade-up mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-foreground/60" style={stagger(4, 90)}>
            {["Free to start", "Works on your phone", "Your data stays yours"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8">
        <h2 className="mb-2 text-center text-2xl font-semibold tracking-tight">Everything a site needs</h2>
        <p className="mb-8 text-center text-sm text-foreground/60">Fast to fill in on site, clear to read in the office.</p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon, accent, title, body }, i) => (
            <li key={title} className="animate-fade-up lift rounded-2xl border border-foreground/[0.07] bg-surface p-6 shadow-sm" style={stagger(i, 70)}>
              <IconChip icon={icon} accent={accent} size="lg" />
              <p className="mt-4 font-semibold">{title}</p>
              <p className="mt-1 text-sm text-foreground/60">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-400 px-6 py-12 text-center text-white shadow-lg shadow-orange-500/20 sm:px-12">
          <div aria-hidden className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
          <div aria-hidden className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-white/10" />
          <h2 className="relative text-2xl font-semibold sm:text-3xl">Start your first project in a minute</h2>
          <p className="relative mx-auto mt-2 max-w-xl text-white/85">Add your site, set a budget, and start logging materials and labour today.</p>
          <Link
            href="/register"
            className="relative mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-orange-600 shadow-sm transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
