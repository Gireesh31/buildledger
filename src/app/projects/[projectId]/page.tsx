import { ArrowRight, Images, IndianRupee, type LucideIcon, NotebookPen, Package, PiggyBank, Ruler, Truck, Users } from "lucide-react";
import Link from "next/link";
import { BudgetMeter, Card, EmptyState, IconChip, stagger, StatTile, type Accent } from "@/components/ui/primitives";
import { choiceLabel, getCollection, optionLabel } from "@/lib/collections";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import { computeLedger, LEDGER_COLLECTIONS } from "@/lib/ledger";
import { requirePageAccess } from "@/lib/server/page-data";
import { listRecords, loadRecords } from "@/lib/server/record-store";

const QUICK_ADD: { href: string; label: string; icon: LucideIcon; accent: Accent }[] = [
  { href: "materials", label: "Material", icon: Package, accent: "amber" },
  { href: "labour", label: "Attendance", icon: Users, accent: "green" },
  { href: "transport", label: "Vehicle", icon: Truck, accent: "blue" },
  { href: "daily-log", label: "Daily log", icon: NotebookPen, accent: "violet" },
  { href: "files", label: "Bill / photo", icon: Images, accent: "rose" },
];

export default async function ProjectOverviewPage({ params }: PageProps<"/projects/[projectId]">) {
  const { projectId } = await params;
  const { project } = await requirePageAccess(projectId);
  const [records, logs] = await Promise.all([loadRecords(projectId, LEDGER_COLLECTIONS), listRecords("dailyLogs", projectId)]);
  const ledger = computeLedger({ project, ...records });

  const recentMaterials = [...records.materials].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 5);
  const latestLog = [...logs].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  const materialsDef = getCollection("materials");
  const fields = materialsDef.fields;
  const categoryField = fields.find((f) => f.name === "category")!;
  const unitField = fields.find((f) => f.name === "unit")!;
  const base = `/projects/${projectId}`;
  const maxCategory = Math.max(...ledger.byCategory.map((c) => c.amount), 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          index={0}
          icon={IndianRupee}
          accent="orange"
          label="Total spent"
          value={formatINR(ledger.totalCost)}
          hint={`Materials ${formatINR(ledger.materialTotal)} · Labour ${formatINR(ledger.labourCost)} · Transport ${formatINR(ledger.transportTotal)}`}
        />
        <StatTile
          index={1}
          icon={PiggyBank}
          accent="green"
          label={ledger.remaining < 0 ? "Over budget by" : "Budget remaining"}
          value={ledger.budget > 0 ? formatINR(Math.abs(ledger.remaining)) : "—"}
          hint={
            ledger.budget > 0 ? (
              <BudgetMeter used={ledger.totalCost} budget={ledger.budget} />
            ) : (
              <Link href={`${base}/settings`} className="font-medium text-brand hover:underline">
                Set a budget
              </Link>
            )
          }
        />
        <StatTile
          index={2}
          icon={Ruler}
          accent="violet"
          label="Cost per sq ft"
          value={ledger.costPerSqft !== null ? formatINR(ledger.costPerSqft) : "—"}
          hint={project.areaSqft ? `${formatNumber(project.areaSqft)} sq ft built-up` : "Add the built-up area in settings"}
        />
        <StatTile
          index={3}
          icon={Users}
          accent="rose"
          label="Owed to workers"
          value={formatINR(ledger.workerDueTotal)}
          hint="Wages and team amounts not yet paid"
          tone={ledger.workerDueTotal > 0 ? "critical" : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          title="Recent material purchases"
          className="lg:col-span-2"
          action={
            <Link href={`${base}/materials`} className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {recentMaterials.length === 0 ? (
            <EmptyState>
              No materials yet.{" "}
              <Link href={`${base}/materials`} className="font-medium text-brand underline">
                Add your first purchase
              </Link>
              .
            </EmptyState>
          ) : (
            <ul className="divide-y divide-foreground/[0.07]">
              {recentMaterials.map((m, i) => (
                <li key={m.id} className="animate-fade-up flex items-center justify-between gap-3 py-2.5 text-sm" style={stagger(i, 50)}>
                  <div className="flex min-w-0 items-center gap-3">
                    <IconChip icon={Package} accent="amber" size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{choiceLabel(materialsDef, categoryField, m)}</p>
                      <p className="text-xs text-foreground/60">
                        {formatDate(String(m.date))}
                        {m.quantity !== undefined && ` · ${formatNumber(Number(m.quantity))} ${optionLabel(unitField, m.unit).toLowerCase()}`}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">{formatINR(Number(m.amount ?? 0))}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card title="Quick add">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {QUICK_ADD.map(({ href, label, icon, accent }, i) => (
                <Link
                  key={href}
                  href={`${base}/${href}`}
                  className="animate-fade-up lift flex items-center gap-2 rounded-xl border border-foreground/[0.07] px-3 py-2.5 font-medium hover:border-brand/30"
                  style={stagger(i, 40)}
                >
                  <IconChip icon={icon} accent={accent} size="sm" />
                  {label}
                </Link>
              ))}
            </div>
          </Card>

          <Card title="Latest site log">
            {latestLog ? (
              <div className="text-sm">
                <p className="text-xs font-medium text-violet-600 dark:text-violet-300">{formatDate(String(latestLog.date))}</p>
                <p className="mt-1 line-clamp-4 whitespace-pre-line">{String(latestLog.workDone)}</p>
              </div>
            ) : (
              <p className="text-sm text-foreground/60">No entries yet.</p>
            )}
          </Card>
        </div>
      </div>

      {ledger.byCategory.length > 0 && (
        <Card
          title="Spend by category"
          action={
            <Link href={`${base}/reports`} className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
              Full report <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <ul className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            {ledger.byCategory.map((c, i) => (
              <li key={c.key} className="animate-fade-up" style={stagger(i, 40)}>
                <div className="flex justify-between">
                  <span>{c.label}</span>
                  <span className="font-medium tabular-nums">{formatINR(c.amount)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.07]">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(c.amount / maxCategory) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
