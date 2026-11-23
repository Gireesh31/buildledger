"use client";

import { useState } from "react";
import { Tooltip } from "@/components/charts/charts";
import { signupPointTitle, type SignupSeries } from "@/lib/signups";

type Range = "daily" | "monthly";
type Metric = "count" | "total";

const RANGES: { value: Range; label: string }[] = [
  { value: "daily", label: "Last 30 days" },
  { value: "monthly", label: "Last 12 months" },
];
const METRICS: { value: Metric; label: string }[] = [
  { value: "count", label: "New sign-ups" },
  { value: "total", label: "Total users" },
];

/** Round-number top for the y axis, never below 4 so small counts still get whole-number ticks. */
function niceTop(max: number) {
  if (max <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  return [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= max)! * magnitude;
}

/** Users over time: new sign-ups or total accounts, per day or per month, with the dates along the bottom. */
export function SignupChart({ series }: { series: SignupSeries }) {
  const [range, setRange] = useState<Range>("daily");
  const [metric, setMetric] = useState<Metric>("count");
  const data = series[range];
  const values = data.map((d) => d[metric]);
  const top = niceTop(Math.max(...values, 0));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * top);
  const HEIGHT = 200;
  // Daily: label every 5th day and today, so the dates stay readable.
  const showLabel = (i: number) => range === "monthly" || i === data.length - 1 || (data.length - 1 - i) % 5 === 0;
  const periodTotal = data.reduce((sum, d) => sum + d.count, 0);
  const caption = `${METRICS.find((m) => m.value === metric)!.label}, ${RANGES.find((r) => r.value === range)!.label.toLowerCase()}`;

  return (
    <section className="rounded-xl border border-foreground/[0.07] bg-surface p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Users over time</h2>
          <p className="text-xs text-foreground/60">
            {periodTotal === 1 ? "1 new sign-up" : `${periodTotal} new sign-ups`} in the {range === "daily" ? "last 30 days" : "last 12 months"} · {data.at(-1)?.total ?? 0} users in all
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Segmented options={METRICS} value={metric} onChange={setMetric} label="What to show" />
          <Segmented options={RANGES} value={range} onChange={setRange} label="Period" />
        </div>
      </div>

      <figure>
        <div className="flex gap-2">
          <div className="relative w-8 shrink-0 text-right text-[10px] text-foreground/50" style={{ height: HEIGHT }} aria-hidden>
            {ticks.map((t) => (
              <span key={t} className="absolute right-0" style={{ bottom: `${(t / top) * 100}%`, transform: "translateY(50%)" }}>
                {Number.isInteger(t) ? t : ""}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1 overflow-x-auto">
            <div className="relative" style={{ height: HEIGHT, minWidth: data.length * (range === "daily" ? 10 : 36) }}>
              {ticks.map((t) => (
                <div key={t} aria-hidden className="absolute inset-x-0 h-px" style={{ bottom: `${(t / top) * 100}%`, background: t === 0 ? "var(--axis)" : "var(--grid)" }} />
              ))}
              <ul className="absolute inset-0 flex items-end justify-around gap-[2px]" aria-label={caption}>
                {data.map((d) => {
                  const value = d[metric];
                  return (
                    <li key={d.key} className="flex h-full flex-1 items-end justify-center">
                      <div
                        tabIndex={0}
                        aria-label={`${signupPointTitle(d)}: ${d.count} new, ${d.total} in all`}
                        className="group relative w-full max-w-6 rounded-t outline-none transition-[height] duration-300 focus-visible:ring-2 focus-visible:ring-foreground/40"
                        style={{ height: `${Math.max((value / top) * 100, value > 0 ? 1.5 : 0)}%`, background: "var(--series-1)" }}
                      >
                        <Tooltip title={signupPointTitle(d)} value={`${d.count} new · ${d.total} in all`} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="mt-1 flex justify-around gap-[2px] text-[10px] text-foreground/50" style={{ minWidth: data.length * (range === "daily" ? 10 : 36) }} aria-hidden>
              {data.map((d, i) => (
                <span key={d.key} className="flex-1 whitespace-nowrap text-center">
                  {showLabel(i) ? d.label : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer text-foreground/60 hover:text-foreground">Show as table</summary>
          <table className="mt-2 w-full">
            <caption className="sr-only">{caption}</caption>
            <thead className="text-foreground/60">
              <tr>
                <th className="py-1 text-left font-medium">Date</th>
                <th className="py-1 text-right font-medium">New</th>
                <th className="py-1 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10">
              {[...data].reverse().map((d) => (
                <tr key={d.key}>
                  <td className="py-1">{signupPointTitle(d)}</td>
                  <td className="py-1 text-right tabular-nums">{d.count}</td>
                  <td className="py-1 text-right tabular-nums">{d.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </figure>
    </section>
  );
}

function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-lg border border-foreground/10 p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2.5 py-1 transition-colors ${value === o.value ? "bg-foreground font-medium text-background" : "text-foreground/70 hover:bg-brand-soft"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
