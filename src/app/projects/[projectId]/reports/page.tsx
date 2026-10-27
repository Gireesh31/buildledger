import { BarChart3, IndianRupee, Package, Truck, Users, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { BarList, MonthlyColumns } from "@/components/charts/charts";
import { ExportPdfButtons } from "@/components/reports/ExportPdfButtons";
import { PeriodReportView } from "@/components/reports/PeriodReportView";
import { Card, EmptyState, PageHeader, StatTile } from "@/components/ui/primitives";
import { choiceLabel, getCollection, isTeam, optionLabel } from "@/lib/collections";
import { formatINR } from "@/lib/format";
import { computeLedger, LEDGER_COLLECTIONS } from "@/lib/ledger";
import type { ReportData } from "@/lib/period-report";
import { requirePageAccess } from "@/lib/server/page-data";
import { loadRecords } from "@/lib/server/record-store";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage({ params }: PageProps<"/projects/[projectId]/reports">) {
  const { projectId } = await params;
  const { project } = await requirePageAccess(projectId);
  const records = await loadRecords(projectId, LEDGER_COLLECTIONS);
  const ledger = computeLedger({ project, ...records });
  const lastMonths = ledger.byMonth.slice(-12);

  // Plain, already-labelled data for the period report (rendered and turned into a PDF in the browser).
  const materialFields = getCollection("materials").fields;
  const label = (collection: "materials" | "workers", field: string, value: unknown) =>
    optionLabel(getCollection(collection).fields.find((f) => f.name === field)!, value);
  const transportDef = getCollection("transport");
  // Day 1: the project's start date, or its earliest entry, or the day it was created.
  const firstEntry = [...records.materials, ...records.transport, ...records.attendance, ...records.workers]
    .map((r) => String(r.date ?? ""))
    .filter(Boolean)
    .sort()[0];
  const reportData: ReportData = {
    startDate: project.startDate ?? firstEntry ?? project.createdAt.slice(0, 10),
    materials: records.materials
      .filter((m) => ["date", "category", "unit", "quantity", "unitPrice"].every((name) => m[name] !== undefined))
      .map((m) => ({
        date: String(m.date),
        material: choiceLabel(getCollection("materials"), materialFields.find((f) => f.name === "category")!, m),
        unit: label("materials", "unit", m.unit),
        quantity: Number(m.quantity),
        unitPrice: Number(m.unitPrice),
        amount: Number(m.amount ?? 0),
        status: String(m.paymentStatus ?? ""),
      })),
    workers: records.workers.map((w) => ({
      id: w.id,
      name: String(w.name),
      trade: label("workers", "trade", w.trade),
      isTeam: isTeam(w),
      dailyWage: Number(w.dailyWage ?? 0),
      amount: Number(w.amount ?? 0),
      amountPaid: Number(w.amountPaid ?? 0),
      date: String(w.date ?? w.createdAt.slice(0, 10)),
    })),
    attendance: records.attendance.map((a) => ({ date: String(a.date), workerId: String(a.workerId), status: String(a.status) })),
    transport: records.transport.map((t) => ({
      date: String(t.date),
      vehicle: choiceLabel(transportDef, transportDef.fields.find((f) => f.name === "vehicle")!, t),
      transportName: String(t.transportName ?? ""),
      hours: t.chargeType === "hourly" ? Number(t.hours ?? 0) : null,
      ratePerHour: t.chargeType === "hourly" ? Number(t.ratePerHour ?? 0) : null,
      amount: Number(t.amount ?? 0),
      status: String(t.paymentStatus ?? ""),
    })),
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" icon={BarChart3} accent="violet" description="Project totals, spending trends, and daily, weekly or monthly reports you can download as PDF." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile index={0} icon={IndianRupee} accent="orange" label="Total cost" value={formatINR(ledger.totalCost)} />
        <StatTile index={1} icon={Package} accent="amber" label="Material purchases" value={formatINR(ledger.materialTotal)} />
        <StatTile index={2} icon={Users} accent="green" label="Labour" value={formatINR(ledger.labourCost)} />
        <StatTile index={3} icon={Truck} accent="violet" label="Transport" value={formatINR(ledger.transportTotal)} />
        <StatTile index={4} icon={Wallet} accent="blue" label="Paid out" value={formatINR(ledger.paidTotal)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Spend by category">
          {ledger.byCategory.length === 0 ? (
            <EmptyState>No spending recorded yet.</EmptyState>
          ) : (
            <BarList caption="Spend by category" data={ledger.byCategory.map((c) => ({ label: c.label, value: c.amount }))} />
          )}
        </Card>
        <Card title={lastMonths.length < ledger.byMonth.length ? "Monthly spend (last 12 months)" : "Monthly spend"}>
          {lastMonths.length === 0 ? <EmptyState>No spending recorded yet.</EmptyState> : <MonthlyColumns caption="Monthly spend" data={lastMonths} />}
        </Card>
      </div>

      <Card title="Daily, weekly, monthly & custom-date report">
        <PeriodReportView data={reportData} projectName={project.name} />
      </Card>

      <Card title="Download lists as PDF" className="no-print">
        <p className="mb-3 text-sm text-foreground/60">Every entry in each list, as a PDF table.</p>
        <ExportPdfButtons projectId={projectId} projectName={project.name} />
      </Card>
    </div>
  );
}
