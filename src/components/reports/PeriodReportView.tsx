"use client";

import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, FileDown, IndianRupee, Loader2, Package, Truck, Users, Wallet } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { PaymentStatusBadge } from "@/components/ui/PaymentStatusBadge";
import { buttonClass, EmptyState, inputClass, StatTile } from "@/components/ui/primitives";
import { formatDate, formatINR, formatNumber, todayISO } from "@/lib/format";
import { buildPeriodReport, periodRange, type PeriodMode, type ReportData } from "@/lib/period-report";

const MODES: { value: PeriodMode; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "total", label: "Day 1 to today" },
  { value: "custom", label: "Custom dates" },
];

const REPORT_NAME: Record<PeriodMode, string> = { day: "Daily", week: "Weekly", month: "Monthly", total: "Day 1 to today", custom: "Custom dates" };

/** One-click PDFs for today, this week, this month and the whole project so far. */
const QUICK_PDFS: { mode: PeriodMode; label: string }[] = [
  { mode: "day", label: "Today" },
  { mode: "week", label: "This week" },
  { mode: "month", label: "This month" },
  { mode: "total", label: "Day 1 to today" },
];

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

function periodLabel(mode: PeriodMode, from: string, to: string) {
  if (mode === "day") return longDate(from);
  if (mode === "total") return `${formatDate(from)} (day 1) – ${formatDate(to)}`;
  if (mode === "month") return new Date(`${from}T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  if (mode === "custom") {
    const days = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
    return from === to ? longDate(from) : `${formatDate(from)} – ${formatDate(to)} (${days} days)`;
  }
  return `${formatDate(from)} – ${formatDate(to)}`;
}

/** Moves the selected date one day, week or month back or forward. */
function shift(mode: PeriodMode, date: string, step: -1 | 1) {
  const [y, m, d] = date.split("-").map(Number);
  const next =
    mode === "month" ? new Date(Date.UTC(y, m - 1 + step, 1)) : new Date(Date.UTC(y, m - 1, d + step * (mode === "week" ? 7 : 1)));
  return next.toISOString().slice(0, 10);
}

export function PeriodReportView({ data, projectName }: { data: ReportData; projectName: string }) {
  const [mode, setMode] = useState<PeriodMode>("day");
  const [date, setDate] = useState(todayISO);
  // Custom dates: `date` is the first day, `endDate` the last.
  const [endDate, setEndDate] = useState(todayISO);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // "Day 1 to today" always ends today, so the date picker doesn't apply to it.
  const reportDate = mode === "total" ? todayISO() : date;
  const report = useMemo(() => buildPeriodReport(data, mode, reportDate, todayISO(), endDate), [data, mode, reportDate, endDate]);
  const { from, to } = periodRange(mode, reportDate, data.startDate, endDate);
  const label = periodLabel(mode, from, to);
  const t = report.totals;
  const isToday = mode === "day" && date === todayISO();

  /** Downloads the report on screen, or a quick one for today / this week / this month / day 1 to today. */
  async function download(key: string, pdfMode: PeriodMode, pdfDate: string) {
    setDownloading(key);
    setError(null);
    try {
      const { downloadPeriodReportPdf } = await import("@/lib/pdf");
      const pdfReport = pdfMode === mode && pdfDate === reportDate ? report : buildPeriodReport(data, pdfMode, pdfDate, todayISO(), endDate);
      const range = periodRange(pdfMode, pdfDate, data.startDate, endDate);
      await downloadPeriodReportPdf(pdfReport, projectName, periodLabel(pdfMode, range.from, range.to));
    } catch {
      setError("Couldn't create the PDF. Please try again.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto">
          {/* Phones: a tidy 3 + 2 grid; wider screens: one row. */}
          <div role="tablist" aria-label="Report period" className="grid w-full grid-cols-3 gap-1 rounded-xl bg-foreground/5 p-1 text-sm sm:flex sm:w-auto">
            {MODES.map((m) => (
              <button
                key={m.value}
                role="tab"
                aria-selected={mode === m.value}
                onClick={() => {
                  setMode(m.value);
                  if (m.value === "day") setDate(todayISO());
                  // Start custom dates on the last 7 days; both ends can then be changed.
                  if (m.value === "custom") {
                    setEndDate(todayISO());
                    setDate(shift("day", shift("week", todayISO(), -1), 1));
                  }
                }}
                className={`whitespace-nowrap rounded-lg px-2 py-1.5 font-medium transition-all duration-200 sm:px-4 ${
                  mode === m.value ? "bg-brand text-white shadow-sm shadow-brand/30" : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {mode === "custom" && (
            <div className="flex w-full items-end gap-2 sm:w-auto">
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-foreground/60 sm:flex-none">
                From
                <span className="relative flex items-center">
                  <CalendarDays className="pointer-events-none absolute left-3 h-4 w-4 text-brand" aria-hidden />
                  <input
                    type="date"
                    value={date}
                    max={endDate}
                    onChange={(e) => e.target.value && setDate(e.target.value)}
                    className={`${inputClass} w-full pl-9 sm:w-44`}
                  />
                </span>
              </label>
              <span className="pb-2.5 text-foreground/40" aria-hidden>
                →
              </span>
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-foreground/60 sm:flex-none">
                To
                <span className="relative flex items-center">
                  <CalendarDays className="pointer-events-none absolute left-3 h-4 w-4 text-brand" aria-hidden />
                  <input
                    type="date"
                    value={endDate}
                    min={date}
                    onChange={(e) => e.target.value && setEndDate(e.target.value)}
                    className={`${inputClass} w-full pl-9 sm:w-44`}
                  />
                </span>
              </label>
            </div>
          )}
          {mode !== "total" && mode !== "custom" && (
          <div className="flex items-center gap-1">
            <button onClick={() => setDate(shift(mode, date, -1))} aria-label={`Previous ${mode}`} className={buttonClass("ghost", "sm")}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <label className="relative flex items-center">
              <span className="sr-only">Pick a date</span>
              <CalendarDays className="pointer-events-none absolute left-3 h-4 w-4 text-brand" aria-hidden />
              <input
                type="date"
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className={`${inputClass} w-44 pl-9`}
              />
            </label>
            <button onClick={() => setDate(shift(mode, date, 1))} aria-label={`Next ${mode}`} className={buttonClass("ghost", "sm")}>
              <ChevronRight className="h-4 w-4" />
            </button>
            {!isToday && (
              <button onClick={() => setDate(todayISO())} className={buttonClass("ghost", "sm")}>
                Today
              </button>
            )}
          </div>
          )}
        </div>
        <button onClick={() => download("current", mode, reportDate)} disabled={downloading !== null} className={`${buttonClass("primary", "sm")} w-full sm:w-auto`}>
          {downloading === "current" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <FileDown className="h-3.5 w-3.5" aria-hidden />}
          Download {REPORT_NAME[mode].toLowerCase()} PDF
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-brand-soft/50 px-3 py-2 text-sm">
        <span className="font-medium text-foreground/70">Quick PDF:</span>
        {QUICK_PDFS.map((q) => (
          <button key={q.mode} onClick={() => download(q.mode, q.mode, todayISO())} disabled={downloading !== null} className={buttonClass("secondary", "sm")}>
            {downloading === q.mode ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <FileDown className="h-3.5 w-3.5 text-brand" aria-hidden />}
            {q.label}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-critical">{error}</p>}

      <div key={`${mode}-${from}-${to}`} className="animate-fade-in flex flex-col gap-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand">{REPORT_NAME[mode]} report</p>
          <h3 className="text-lg font-semibold">{label}</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <StatTile index={0} icon={Package} accent="amber" label="Materials" value={formatINR(t.materials)} />
          <StatTile index={1} icon={Users} accent="green" label="Labour" value={formatINR(t.labour)} />
          <StatTile index={2} icon={Truck} accent="violet" label="Transport" value={formatINR(t.transport)} />
          <StatTile
            index={3}
            icon={IndianRupee}
            accent="orange"
            label="Total spent"
            value={formatINR(t.spent)}
            hint={t.billsDue > 0 ? `${formatINR(t.billsDue)} still owed on bills` : undefined}
            tone={t.billsDue > 0 ? "critical" : undefined}
          />
          <StatTile index={4} icon={Wallet} accent="blue" label="Paid out" value={formatINR(t.paid)} />
          <StatTile
            index={5}
            icon={AlertCircle}
            accent="rose"
            label="Outstanding dues"
            value={formatINR(t.due)}
            hint={`as of ${formatDate(report.duesAsOf)}`}
            tone={t.due > 0 ? "critical" : undefined}
          />
        </div>

        <Section title="Material purchases" empty="No material purchases in this period." count={report.materials.length}>
          <Table
            head={["Date", "Material", "Status", "Quantity", "Price per unit", "Total"]}
            right={[3, 4, 5]}
            rows={report.materials.map((m) => [
              formatDate(m.date),
              m.material,
              <PaymentStatusBadge key="s" status={m.status} />,
              `${formatNumber(m.quantity)} ${m.unit.toLowerCase()}`,
              formatINR(m.unitPrice, true),
              formatINR(m.amount, true),
            ])}
            foot={["Total", "", "", "", "", formatINR(t.materials, true)]}
          />
        </Section>

        <Section title="Labour" empty="No attendance or team work in this period." count={report.labour.length}>
          <Table
            head={["Date", "Worker / team", "Details", "Amount"]}
            right={[3]}
            rows={report.labour.map((l) => [formatDate(l.date), l.name, l.detail, formatINR(l.amount, true)])}
            foot={["Total", "", "", formatINR(t.labour, true)]}
          />
        </Section>

        <Section title="Transport & machinery" empty="No vehicles hired in this period." count={report.transport.length}>
          <Table
            head={["Date", "Vehicle", "Transport", "Charged", "Status", "Amount"]}
            right={[5]}
            rows={report.transport.map((v) => [formatDate(v.date), v.vehicle, v.transportName || "—", v.hours !== null ? `${formatNumber(v.hours)} hrs × ${formatINR(v.ratePerHour ?? 0)}` : "Full amount", <PaymentStatusBadge key="s" status={v.status} />, formatINR(v.amount, true)])}
            foot={["Total", "", "", "", "", formatINR(t.transport, true)]}
          />
        </Section>

        <Section title="Paid to workers & teams" empty="Nothing paid in this period." count={report.payments.length}>
          <Table
            head={["Date", "Paid to", "Amount"]}
            right={[2]}
            rows={report.payments.map((p) => [formatDate(p.date), p.payee, formatINR(p.amount, true)])}
            foot={["Total", "", formatINR(t.paid, true)]}
          />
        </Section>

        <Section title={`Outstanding dues as of ${formatDate(report.duesAsOf)}`} empty="Nothing owed. All workers and teams are settled." count={report.dues.length}>
          <Table
            head={["Worker / team", "Type", "Last worked", "Earned", "Paid", "Due"]}
            right={[3, 4, 5]}
            rows={report.dues.map((d) => [
              d.name,
              d.kind,
              d.lastWorked ? formatDate(d.lastWorked) : "—",
              formatINR(d.earned, true),
              formatINR(d.paid, true),
              <span key="due" className="font-semibold text-critical">
                {formatINR(d.due, true)}
              </span>,
            ])}
            foot={["Total", "", "", "", "", formatINR(t.due, true)]}
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, empty, count, children }: { title: string; empty: string; count: number; children: ReactNode }) {
  return (
    <section>
      <h4 className="mb-2 text-sm font-semibold">
        {title} {count > 0 && <span className="font-normal text-foreground/50">({count})</span>}
      </h4>
      {count === 0 ? <EmptyState>{empty}</EmptyState> : children}
    </section>
  );
}

function Table({ head, rows, right, foot }: { head: string[]; rows: ReactNode[][]; right: number[]; foot?: ReactNode[] }) {
  const align = (i: number) => (right.includes(i) ? "text-right tabular-nums" : "text-left");
  return (
    <div className="overflow-x-auto rounded-2xl border border-foreground/[0.07] bg-surface shadow-sm">
      <table className="w-full min-w-[520px] text-sm">
        <thead className="bg-brand-soft/60 text-xs text-foreground/70">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`px-3 py-2 font-medium ${align(i)}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-foreground/[0.07]">
          {rows.map((cells, r) => (
            <tr key={r} className="transition-colors hover:bg-brand-soft/40">
              {cells.map((cell, i) => (
                <td key={i} className={`px-3 py-2 ${align(i)}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {foot && (
          <tfoot className="border-t border-foreground/15 font-semibold">
            <tr>
              {foot.map((cell, i) => (
                <td key={i} className={`px-3 py-2 ${align(i)}`}>
                  {cell}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

