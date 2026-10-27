import { formatINR, formatINRCompact, formatMonth } from "@/lib/format";

/*
 * Single-series charts in plain HTML/CSS. One hue (--series-1), thin bars with a 4px rounded
 * data end, hairline grid, a hover/focus tooltip on every bar, and a table view for each chart.
 */

function Tooltip({ title, value }: { title: string; value: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-foreground/10 bg-background px-2 py-1 text-xs shadow-md group-hover:block group-focus-visible:block"
    >
      <span className="block text-foreground/60">{title}</span>
      <span className="block font-semibold text-foreground">{value}</span>
    </span>
  );
}

function TableView({ caption, rows }: { caption: string; rows: [string, number][] }) {
  return (
    <details className="mt-3 text-xs">
      <summary className="no-print cursor-pointer text-foreground/60 hover:text-foreground">Show as table</summary>
      <table className="mt-2 w-full">
        <caption className="sr-only">{caption}</caption>
        <tbody className="divide-y divide-foreground/10">
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td className="py-1">{label}</td>
              <td className="py-1 text-right tabular-nums">{formatINR(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** Horizontal bars for comparing amounts across categories; value at each bar's tip. */
export function BarList({ data, caption }: { data: { label: string; value: number }[]; caption: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <figure>
      <ul className="flex flex-col gap-2.5" aria-label={caption}>
        {data.map((d) => {
          const pct = (d.value / max) * 100;
          return (
            <li key={d.label} className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 text-sm">
              <span className="truncate text-foreground/70" title={d.label}>
                {d.label}
              </span>
              <div className="flex items-center gap-2">
                <div
                  tabIndex={0}
                  aria-label={`${d.label}: ${formatINR(d.value)}`}
                  className="group relative h-4 min-w-1 rounded-r outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
                  style={{ width: `${Math.max(pct, 0.5)}%`, maxWidth: "calc(100% - 4.5rem)", background: "var(--series-1)" }}
                >
                  <Tooltip title={d.label} value={`${formatINR(d.value)} · ${total ? Math.round((d.value / total) * 100) : 0}%`} />
                </div>
                <span className="shrink-0 text-xs tabular-nums text-foreground/70">{formatINRCompact(d.value)}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <TableView caption={caption} rows={data.map((d) => [d.label, d.value])} />
    </figure>
  );
}

function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value)! * magnitude;
  return step;
}

/** Vertical columns over time, with compact y-axis ticks and a tooltip per month. */
export function MonthlyColumns({ data, caption }: { data: { month: string; amount: number }[]; caption: string }) {
  const top = niceMax(Math.max(...data.map((d) => d.amount), 0));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * top);
  const HEIGHT = 180;

  return (
    <figure>
      <div className="flex gap-2">
        {/* Y axis */}
        <div className="relative w-12 shrink-0 text-right text-[10px] text-foreground/50" style={{ height: HEIGHT }} aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0" style={{ bottom: `${(t / top) * 100}%`, transform: "translateY(50%)" }}>
              {formatINRCompact(t)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="relative" style={{ height: HEIGHT, minWidth: data.length * 36 }}>
            {/* Hairline gridlines */}
            {ticks.map((t) => (
              <div
                key={t}
                aria-hidden
                className="absolute inset-x-0 h-px"
                style={{ bottom: `${(t / top) * 100}%`, background: t === 0 ? "var(--axis)" : "var(--grid)" }}
              />
            ))}
            <ul className="absolute inset-0 flex items-end justify-around gap-[2px]" aria-label={caption}>
              {data.map((d) => (
                <li key={d.month} className="flex h-full flex-1 items-end justify-center">
                  <div
                    tabIndex={0}
                    aria-label={`${formatMonth(d.month)}: ${formatINR(d.amount)}`}
                    className="group relative w-full max-w-6 rounded-t outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
                    style={{ height: `${Math.max((d.amount / top) * 100, d.amount > 0 ? 1 : 0)}%`, background: "var(--series-1)" }}
                  >
                    <Tooltip title={formatMonth(d.month)} value={formatINR(d.amount)} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-1 flex justify-around gap-[2px] text-[10px] text-foreground/50" style={{ minWidth: data.length * 36 }} aria-hidden>
            {data.map((d) => (
              <span key={d.month} className="flex-1 text-center">
                {formatMonth(d.month).replace(" 20", " ’")}
              </span>
            ))}
          </div>
        </div>
      </div>
      <TableView caption={caption} rows={data.map((d) => [formatMonth(d.month), d.amount])} />
    </figure>
  );
}
