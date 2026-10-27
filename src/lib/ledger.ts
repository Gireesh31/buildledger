import { isTeam, materialCategories } from "@/lib/collections";
import type { LedgerRecord, Project } from "@/lib/types";

export interface LedgerInput {
  project: Project;
  workers: LedgerRecord[];
  attendance: LedgerRecord[];
  /** Vehicles and machinery hired (per hour or full amount). */
  transport: LedgerRecord[];
  /** Material purchases from the Materials page (quantity × unit price). */
  materials: LedgerRecord[];
}

const num = (value: unknown) => (typeof value === "number" ? value : 0);
const sum = (records: LedgerRecord[], field = "amount") => records.reduce((total, r) => total + num(r[field]), 0);

export const DAILY_LABOUR_KEY = "daily-labour";
export const TRANSPORT_KEY = "transport";
const DAY_FRACTION: Record<string, number> = { present: 1, half: 0.5, absent: 0 };

/**
 * Labour cost entries: each attendance day of an individual worker at their current daily wage,
 * plus each team's fixed amount on the team's date.
 */
function labourEntries(workers: LedgerRecord[], attendance: LedgerRecord[]) {
  const wages = new Map(workers.filter((w) => !isTeam(w)).map((w) => [w.id, num(w.dailyWage)]));
  const daily = attendance
    .filter((a) => wages.has(String(a.workerId)))
    .map((a) => ({
      workerId: String(a.workerId),
      date: String(a.date),
      days: DAY_FRACTION[String(a.status)] ?? 0,
      earned: (DAY_FRACTION[String(a.status)] ?? 0) * (wages.get(String(a.workerId)) ?? 0),
    }));
  const teams = workers.filter(isTeam).map((t) => ({
    workerId: t.id,
    date: String(t.date ?? t.createdAt.slice(0, 10)),
    days: 0,
    earned: num(t.amount),
  }));
  return [...daily, ...teams];
}

export function computeLedger(input: LedgerInput) {
  const { project, workers, attendance, transport, materials } = input;
  const labour = labourEntries(workers, attendance);

  const materialTotal = sum(materials);
  const labourCost = labour.reduce((total, l) => total + l.earned, 0);
  const transportTotal = sum(transport);
  const totalCost = materialTotal + labourCost + transportTotal;
  // "Amount paid" entered on the worker/team form.
  const paidTotal = sum(workers, "amountPaid");
  const budget = project.budget ?? 0;

  const byCategory = [
    // Each material type (cement, steel, sand, …) from the Materials page, plus labour and transport.
    ...materialCategories.map((c) => ({
      key: c.value,
      label: c.label,
      amount: sum(materials.filter((m) => m.category === c.value)),
    })),
    { key: DAILY_LABOUR_KEY, label: "Labour (workers & teams)", amount: labourCost },
    { key: TRANSPORT_KEY, label: "Transport & machinery", amount: transportTotal },
  ]
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const months = new Map<string, number>();
  for (const e of [...materials, ...transport]) months.set(String(e.date).slice(0, 7), (months.get(String(e.date).slice(0, 7)) ?? 0) + num(e.amount));
  for (const l of labour) months.set(l.date.slice(0, 7), (months.get(l.date.slice(0, 7)) ?? 0) + l.earned);
  const byMonth = [...months.entries()]
    .filter(([month]) => /^\d{4}-\d{2}$/.test(month))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  const workerDues = workers
    .map((w) => {
      const mine = labour.filter((l) => l.workerId === w.id);
      const earned = mine.reduce((total, l) => total + l.earned, 0);
      const paid = num(w.amountPaid);
      return {
        id: w.id,
        name: String(w.name),
        isTeam: isTeam(w),
        trade: String(w.trade ?? ""),
        dailyWage: num(w.dailyWage),
        days: mine.reduce((total, l) => total + l.days, 0),
        earned,
        paid,
        due: earned - paid,
      };
    })
    .sort((a, b) => b.due - a.due);

  return {
    materialTotal,
    labourCost,
    transportTotal,
    totalCost,
    paidTotal,
    budget,
    remaining: budget - totalCost,
    budgetUsedPct: budget > 0 ? (totalCost / budget) * 100 : null,
    costPerSqft: project.areaSqft ? totalCost / project.areaSqft : null,
    workerDueTotal: workerDues.reduce((total, w) => total + Math.max(0, w.due), 0),
    byCategory,
    byMonth,
    workerDues,
  };
}

export type Ledger = ReturnType<typeof computeLedger>;

export const LEDGER_COLLECTIONS = [
  "workers",
  "attendance",
  "transport",
  "materials",
] as const;
