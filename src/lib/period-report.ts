/**
 * Project report for one day, week or month: material purchases, labour, transport, payments,
 * and what's owed to each worker/team as of the period's last day.
 * Plain data in, plain data out, so the page and the PDF show exactly the same numbers.
 */

/**
 * "total" runs from the project's first day (its start date, or its first entry) to today;
 * "custom" covers any chosen from–to dates.
 */
export type PeriodMode = "day" | "week" | "month" | "total" | "custom";

export interface ReportData {
  /** Day 1 of the project: its start date, or the earliest entry. */
  startDate: string;
  /** `balance` is what is still owed on the bill (all of it when Due, the rest when Part paid). */
  materials: { date: string; material: string; unit: string; quantity: number; unitPrice: number; amount: number; status: PaymentStatus; balance: number }[];
  workers: {
    id: string;
    name: string;
    trade: string;
    isTeam: boolean;
    dailyWage: number;
    /** Team amount (teams only). */
    amount: number;
    /** "Amount paid" entered on the worker form; counts on the worker's date. */
    amountPaid: number;
    date: string;
  }[];
  attendance: { date: string; workerId: string; status: string }[];
  /** `hours` and `ratePerHour` are null for full-amount hires. */
  transport: { date: string; vehicle: string; transportName: string; hours: number | null; ratePerHour: number | null; amount: number; status: PaymentStatus; balance: number }[];
}

/** Payment status of a bill: "advance" | "paid" | "partial" | "due", or "" for older entries without one. */
export type PaymentStatus = string;

export const PAYMENT_STATUS_LABEL: Record<string, string> = { advance: "Paid in advance", paid: "Paid", partial: "Part paid", due: "Due" };

const DAY_FRACTION: Record<string, number> = { present: 1, half: 0.5, absent: 0 };
const STATUS_LABEL: Record<string, string> = { present: "Present", half: "Half day", absent: "Absent" };

// Dates are "YYYY-MM-DD" strings; arithmetic is in UTC so time zones can't shift a day.
const toUTC = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUTC = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => fromUTC(toUTC(iso) + days * 86_400_000);

/**
 * First and last date of the day, week (Monday–Sunday) or month containing `date`;
 * for "total", from `startDate` (day 1) to `date`; for "custom", from `date` to `endDate` (either order).
 */
export function periodRange(mode: PeriodMode, date: string, startDate?: string, endDate?: string): { from: string; to: string } {
  if (mode === "day") return { from: date, to: date };
  if (mode === "custom") {
    const end = endDate ?? date;
    return end < date ? { from: end, to: date } : { from: date, to: end };
  }
  if (mode === "total") return { from: startDate && startDate < date ? startDate : date, to: date };
  if (mode === "week") {
    const mondayOffset = (new Date(toUTC(date)).getUTCDay() + 6) % 7;
    const from = addDays(date, -mondayOffset);
    return { from, to: addDays(from, 6) };
  }
  const [y, m] = date.split("-").map(Number);
  return { from: `${date.slice(0, 7)}-01`, to: fromUTC(Date.UTC(y, m, 0)) };
}

export interface LabourLine {
  date: string;
  name: string;
  detail: string;
  amount: number;
}

export interface DueLine {
  name: string;
  kind: "Worker" | "Team";
  /** Most recent day worked (or the team's date) up to the end of the period. */
  lastWorked: string | null;
  earned: number;
  paid: number;
  due: number;
}

export interface PeriodReport {
  mode: PeriodMode;
  from: string;
  to: string;
  materials: ReportData["materials"];
  labour: LabourLine[];
  transport: ReportData["transport"];
  /** "Amount paid" entered on worker/team forms, on the worker's date. */
  payments: { date: string; payee: string; method: string; amount: number }[];
  /** The date dues are worked out to: the period's last day, or today if that's still ahead. */
  duesAsOf: string;
  /** Outstanding as of `duesAsOf`, only people with something due. */
  dues: DueLine[];
  totals: { materials: number; labour: number; transport: number; spent: number; billsDue: number; paid: number; due: number };
}

export function buildPeriodReport(data: ReportData, mode: PeriodMode, date: string, today?: string, endDate?: string): PeriodReport {
  const { from, to } = periodRange(mode, date, data.startDate, endDate);
  const duesAsOf = today && today < to ? today : to;
  const inRange = (d: string) => d >= from && d <= to;
  const byId = new Map(data.workers.map((w) => [w.id, w]));
  const wageOf = (a: ReportData["attendance"][number]) => (DAY_FRACTION[a.status] ?? 0) * (byId.get(a.workerId)?.dailyWage ?? 0);
  const individualAttendance = data.attendance.filter((a) => byId.has(a.workerId) && !byId.get(a.workerId)!.isTeam);

  const materials = data.materials.filter((m) => inRange(m.date)).sort((a, b) => a.date.localeCompare(b.date));

  const labour: LabourLine[] = [
    ...individualAttendance
      .filter((a) => inRange(a.date))
      .map((a) => ({ date: a.date, name: byId.get(a.workerId)!.name, detail: STATUS_LABEL[a.status] ?? a.status, amount: wageOf(a) })),
    ...data.workers
      .filter((w) => w.isTeam && inRange(w.date))
      .map((t) => ({ date: t.date, name: t.name, detail: `Team · ${t.trade}`, amount: t.amount })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));

  const transport = data.transport.filter((t) => inRange(t.date)).sort((a, b) => a.date.localeCompare(b.date));

  // "Amount paid" from the worker form, counted on the worker's date.
  const allPayments = data.workers
    .filter((w) => w.amountPaid > 0)
    .map((w) => ({ date: w.date, payee: w.name, workerId: w.id, method: "Paid to worker / team", amount: w.amountPaid }));
  const payments = allPayments
    .filter((p) => inRange(p.date))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ date: d, payee, method, amount }) => ({ date: d, payee, method, amount }));

  // Dues as of the end of the period (or today): everything earned and paid up to that date.
  const dues: DueLine[] = data.workers
    .map((w) => {
      const days = individualAttendance.filter((a) => a.workerId === w.id && a.date <= duesAsOf);
      const earned = w.isTeam ? (w.date <= duesAsOf ? w.amount : 0) : days.reduce((s, a) => s + wageOf(a), 0);
      const paid = allPayments.filter((p) => p.workerId === w.id && p.date <= duesAsOf).reduce((s, p) => s + p.amount, 0);
      const worked = w.isTeam ? (w.date <= duesAsOf ? w.date : null) : (days.filter((a) => a.status !== "absent").map((a) => a.date).sort().at(-1) ?? null);
      return { name: w.name, kind: w.isTeam ? ("Team" as const) : ("Worker" as const), lastWorked: worked, earned, paid, due: earned - paid };
    })
    .filter((d) => d.due > 0)
    .sort((a, b) => b.due - a.due);

  const materialTotal = materials.reduce((s, m) => s + m.amount, 0);
  const labourTotal = labour.reduce((s, l) => s + l.amount, 0);
  const transportTotal = transport.reduce((s, t) => s + t.amount, 0);
  // Still owed on this period's material and transport bills ("Due" in full, "Part paid" the rest).
  const billsDue = [...materials, ...transport].reduce((s, b) => s + b.balance, 0);
  return {
    mode,
    from,
    to,
    duesAsOf,
    materials,
    labour,
    transport,
    payments,
    dues,
    totals: {
      materials: materialTotal,
      labour: labourTotal,
      transport: transportTotal,
      spent: materialTotal + labourTotal + transportTotal,
      billsDue,
      paid: payments.reduce((s, p) => s + p.amount, 0),
      due: dues.reduce((s, d) => s + d.due, 0),
    },
  };
}
