import { paymentStatuses } from "@/lib/collections";

const STYLES: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  advance: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  due: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

/** Paid in advance / Paid / Due as a coloured pill. The text says which, so colour isn't the only signal. */
export function PaymentStatusBadge({ status }: { status: string | undefined }) {
  const label = paymentStatuses.find((s) => s.value === status)?.label;
  if (!status || !label) return <span className="text-foreground/40">—</span>;
  return <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] ?? ""}`}>{label}</span>;
}
