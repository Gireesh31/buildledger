import { choiceLabel, getCollection, isTeam, optionLabel } from "@/lib/collections";
import { balanceDue, LEDGER_COLLECTIONS } from "@/lib/ledger";
import type { ReportData } from "@/lib/period-report";
import type { LedgerRecord, Project } from "@/lib/types";

/** Plain, labelled data for the period report — the same as the website's Reports page builds. */
export function buildReportData(project: Project, records: Record<(typeof LEDGER_COLLECTIONS)[number], LedgerRecord[]>): ReportData {
  const field = (collection: "materials" | "workers" | "transport", name: string) => getCollection(collection).fields.find((f) => f.name === name)!;
  const label = (collection: "materials" | "workers" | "transport", name: string, value: unknown) => optionLabel(field(collection, name), value);
  const firstEntry = [...records.materials, ...records.transport, ...records.attendance, ...records.workers]
    .map((r) => String(r.date ?? ""))
    .filter(Boolean)
    .sort()[0];
  return {
    startDate: project.startDate ?? firstEntry ?? project.createdAt.slice(0, 10),
    materials: records.materials
      .filter((m) => ["date", "category", "unit", "quantity", "unitPrice"].every((name) => m[name] !== undefined))
      .map((m) => ({
        date: String(m.date),
        material: choiceLabel(getCollection("materials"), field("materials", "category"), m),
        unit: label("materials", "unit", m.unit),
        quantity: Number(m.quantity),
        unitPrice: Number(m.unitPrice),
        amount: Number(m.amount ?? 0),
        paymentMode: m.paymentMode ? label("materials", "paymentMode", m.paymentMode) : "",
        status: String(m.paymentStatus ?? ""),
        paidAmount: m.paymentStatus === "partial" ? Number(m.paidAmount) || 0 : 0,
        balance: balanceDue(m),
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
      paymentMode: w.paymentMode ? label("workers", "paymentMode", w.paymentMode) : "",
      status: String(w.paymentStatus ?? ""),
    })),
    attendance: records.attendance.map((a) => ({ date: String(a.date), workerId: String(a.workerId), status: String(a.status) })),
    transport: records.transport.map((t) => ({
      date: String(t.date),
      vehicle: choiceLabel(getCollection("transport"), field("transport", "vehicle"), t),
      transportName: String(t.transportName ?? ""),
      hours: t.chargeType === "hourly" ? Number(t.hours ?? 0) : null,
      ratePerHour: t.chargeType === "hourly" ? Number(t.ratePerHour ?? 0) : null,
      paymentMode: t.paymentMode ? label("transport", "paymentMode", t.paymentMode) : "",
      paidAmount: t.paymentStatus === "partial" ? Number(t.paidAmount) || 0 : 0,
      amount: Number(t.amount ?? 0),
      status: String(t.paymentStatus ?? ""),
      balance: balanceDue(t),
    })),
  };
}
