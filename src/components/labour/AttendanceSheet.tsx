"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { FormMessage, sendJson } from "@/components/auth/form";
import { buttonClass, EmptyState, inputClass } from "@/components/ui/primitives";
import { formatINR, todayISO } from "@/lib/format";

type Status = "present" | "half" | "absent";

// Present green, half day amber, absent rose; the label inside each button still says which is which.
const SELECTED_STYLES: Record<Status, string> = {
  present: "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/30",
  half: "border-amber-400 bg-amber-400 text-amber-950 shadow-sm shadow-amber-400/30",
  absent: "border-rose-500 bg-rose-500 text-white shadow-sm shadow-rose-500/30",
};

const STATUS_OPTIONS: { value: Status; short: string; label: string }[] = [
  { value: "present", short: "P", label: "Present" },
  { value: "half", short: "½", label: "Half day" },
  { value: "absent", short: "A", label: "Absent" },
];

interface AttendanceSheetProps {
  projectId: string;
  workers: { id: string; name: string; trade: string; dailyWage: number }[];
  attendance: { date: string; workerId: string; status: string }[];
  canEdit: boolean;
}

export function AttendanceSheet({ projectId, workers, attendance, canEdit }: AttendanceSheetProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [date, setDate] = useState(todayISO);
  const saved = useMemo(
    () => Object.fromEntries(attendance.filter((a) => a.date === date).map((a) => [a.workerId, a.status as Status])),
    [attendance, date],
  );
  const [edits, setEdits] = useState<Record<string, Record<string, Status>>>({});
  const marks = { ...saved, ...edits[date] };
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const setMark = (workerId: string, status: Status) =>
    setEdits((current) => ({ ...current, [date]: { ...current[date], [workerId]: status } }));

  const dayCost = workers.reduce((total, w) => total + w.dailyWage * ({ present: 1, half: 0.5, absent: 0 }[marks[w.id] as Status] ?? 0), 0);
  const present = workers.filter((w) => marks[w.id] === "present" || marks[w.id] === "half").length;

  async function save() {
    setPending(true);
    setMessage(null);
    const entries = Object.entries(marks).map(([workerId, status]) => ({ workerId, status }));
    const result = await sendJson(`/api/projects/${projectId}/attendance`, { date, entries }, "PUT");
    setPending(false);
    if (!result.ok) {
      setMessage({ tone: "error", text: result.error });
      return;
    }
    setEdits((current) => ({ ...current, [date]: {} }));
    setMessage({ tone: "success", text: `Attendance saved for ${entries.length} worker${entries.length === 1 ? "" : "s"}.` });
    startTransition(() => router.refresh());
  }

  if (workers.length === 0) return <EmptyState>Add workers below, then mark their attendance here each day.</EmptyState>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground/80">Date</span>
          <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className={`${inputClass} w-44`} />
        </label>
        <p className="text-sm text-foreground/70">
          {present} on site · Day’s wages <span className="font-semibold text-foreground">{formatINR(dayCost)}</span>
        </p>
      </div>
      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}

      <ul className="divide-y divide-foreground/[0.07] rounded-xl border border-foreground/[0.07]">
        {workers.map((worker) => (
          <li key={worker.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{worker.name}</p>
              <p className="text-xs text-foreground/60">
                {worker.trade} · {formatINR(worker.dailyWage)}/day
              </p>
            </div>
            <div role="radiogroup" aria-label={`Attendance for ${worker.name}`} className="flex gap-1">
              {STATUS_OPTIONS.map((option) => {
                const selected = marks[worker.id] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={option.label}
                    title={option.label}
                    disabled={!canEdit}
                    onClick={() => setMark(worker.id, option.value)}
                    className={`h-9 w-9 rounded-lg border text-sm font-semibold transition-all duration-150 active:scale-90 ${
                      selected ? SELECTED_STYLES[option.value] : "border-foreground/15 text-foreground/70 hover:bg-brand-soft"
                    }`}
                  >
                    {option.short}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      {canEdit && (
        <div className="flex flex-wrap justify-between gap-2">
          <button type="button" onClick={() => workers.forEach((w) => setMark(w.id, "present"))} className={buttonClass("secondary", "sm")}>
            Mark all present
          </button>
          <button type="button" onClick={save} disabled={pending} className={buttonClass("primary")}>
            {pending ? "Saving…" : "Save attendance"}
          </button>
        </div>
      )}
    </div>
  );
}
