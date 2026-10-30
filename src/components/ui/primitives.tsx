import type { LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

const buttonVariants = {
  primary: "bg-brand text-white shadow-[inset_0_-1px_0_rgb(0_0_0/0.15)] hover:bg-brand-strong",
  secondary: "border border-foreground/15 bg-surface hover:border-brand/40 hover:bg-brand-soft",
  danger: "border border-critical/40 text-critical hover:bg-critical/10",
  ghost: "hover:bg-brand-soft",
};

export function buttonClass(variant: keyof typeof buttonVariants = "primary", size: "sm" | "md" = "md") {
  const sizing = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return `inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${sizing} ${buttonVariants[variant]}`;
}

export const inputClass =
  "w-full rounded-lg border border-foreground/15 bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20";

/** Staggered entrance: style={stagger(i)} on items rendered in a list. */
export const stagger = (index: number, step = 60): CSSProperties => ({ "--delay": `${index * step}ms` }) as CSSProperties;

export function Card({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-foreground/[0.07] bg-surface p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// Literal class strings so Tailwind can see them.
const ACCENTS = {
  orange: { chip: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300" },
  blue: { chip: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" },
  green: { chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  violet: { chip: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  rose: { chip: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
  amber: { chip: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
} as const;

export type Accent = keyof typeof ACCENTS;

export function IconChip({ icon: Icon, accent = "orange", size = "md" }: { icon: LucideIcon; accent?: Accent; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-11 w-11 rounded-xl" : size === "sm" ? "h-7 w-7 rounded-md" : "h-9 w-9 rounded-lg";
  const glyph = size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${box} ${ACCENTS[accent].chip}`} aria-hidden>
      <Icon className={glyph} strokeWidth={2} />
    </span>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone,
  icon,
  accent = "orange",
  index = 0,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  tone?: "critical" | "good";
  icon?: LucideIcon;
  accent?: Accent;
  /** Position in a row, for a staggered entrance. */
  index?: number;
}) {
  return (
    <div className="animate-fade-up lift relative overflow-hidden rounded-xl border border-foreground/[0.07] bg-surface p-4 shadow-sm" style={stagger(index)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-foreground/60">{label}</p>
        {icon && <IconChip icon={icon} accent={accent} size="sm" />}
      </div>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && (
        <div className={`mt-1 text-xs ${tone === "critical" ? "text-critical" : tone === "good" ? "text-good" : "text-foreground/60"}`}>{hint}</div>
      )}
    </div>
  );
}

export function PageHeader({ title, description, actions, icon, accent = "orange" }: { title: string; description?: string; actions?: ReactNode; icon?: LucideIcon; accent?: Accent }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && <IconChip icon={icon} accent={accent} size="lg" />}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-foreground/60">{description}</p>}
        </div>
      </div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-foreground/15 bg-surface/60 px-4 py-10 text-center text-sm text-foreground/70">{children}</div>
  );
}

/** Budget meter. Over budget switches to the reserved critical color and always says so in text. */
export function BudgetMeter({ used, budget }: { used: number; budget: number }) {
  if (budget <= 0) return <p className="text-xs text-foreground/60">No budget set.</p>;
  const pct = (used / budget) * 100;
  const over = pct > 100;
  return (
    <div>
      <div
        className="h-2 overflow-hidden rounded-full bg-foreground/10"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label="Budget used"
      >
        <div
          className={`animate-fade-in h-full rounded-full transition-[width] duration-700 ${over ? "bg-critical" : "bg-brand"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className={`mt-1 text-xs ${over ? "font-medium text-critical" : "text-foreground/60"}`}>
        {over ? `⚠ Over budget: ${Math.round(pct)}% used` : `${Math.round(pct)}% of budget used`}
      </p>
    </div>
  );
}
