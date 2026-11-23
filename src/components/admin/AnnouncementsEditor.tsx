"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { FormMessage, sendJson } from "@/components/auth/form";
import { buttonClass, Card, inputClass } from "@/components/ui/primitives";
import { announcementKinds, type Announcement, type AnnouncementKind } from "@/lib/app-config";

interface Draft {
  kind: AnnouncementKind;
  title: string;
  body: string;
  linkUrl: string;
  linkLabel: string;
  /** yyyy-mm-dd in the admin's own time zone; empty means no limit. */
  startsAt: string;
  endsAt: string;
  published: boolean;
}

const empty: Draft = { kind: "news", title: "", body: "", linkUrl: "", linkLabel: "", startsAt: "", endsAt: "", published: true };

const toDay = (isoDate?: string) => {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
/** Starts at the beginning of the chosen day and ends at the end of it, local time. */
const fromDay = (day: string, end: boolean) => (day ? new Date(`${day}T${end ? "23:59:59" : "00:00:00"}`).toISOString() : "");

const draftOf = (a: Announcement): Draft => ({
  kind: a.kind,
  title: a.title,
  body: a.body,
  linkUrl: a.linkUrl ?? "",
  linkLabel: a.linkLabel ?? "",
  startsAt: toDay(a.startsAt),
  endsAt: toDay(a.endsAt),
  published: a.published,
});

export function statusOf(a: Announcement, now = Date.now()): string {
  if (!a.published) return "Draft";
  if (a.startsAt && Date.parse(a.startsAt) > now) return "Scheduled";
  if (a.endsAt && Date.parse(a.endsAt) <= now) return "Ended";
  return "Live";
}

export function AnnouncementsEditor({ initial }: { initial: Announcement[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  function open(target: Announcement | "new") {
    setMessage(null);
    setEditing(target === "new" ? "new" : target.id);
    setDraft(target === "new" ? empty : draftOf(target));
  }

  async function save() {
    setPending(true);
    setMessage(null);
    const body = { ...draft, startsAt: fromDay(draft.startsAt, false), endsAt: fromDay(draft.endsAt, true) };
    const result =
      editing === "new"
        ? await sendJson<Announcement>("/api/admin/announcements", body, "POST")
        : await sendJson<Announcement>(`/api/admin/announcements/${editing}`, body, "PUT");
    setPending(false);
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    setItems(editing === "new" ? [result.data, ...items] : items.map((a) => (a.id === result.data.id ? result.data : a)));
    setEditing(null);
    setMessage({ tone: "success", text: result.data.published ? "Saved. People see it on the website dashboard and the app’s home screen." : "Saved as a draft." });
  }

  async function remove(a: Announcement) {
    if (!window.confirm(`Delete “${a.title}”? It disappears from the website and the app.`)) return;
    setPending(true);
    const result = await sendJson(`/api/admin/announcements/${a.id}`, {}, "DELETE");
    setPending(false);
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    setItems(items.filter((x) => x.id !== a.id));
    if (editing === a.id) setEditing(null);
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft({ ...draft, [key]: value });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <button type="button" onClick={() => open("new")} className={buttonClass("primary")}>
          <Plus className="h-4 w-4" aria-hidden /> New announcement
        </button>
      </div>
      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}

      {editing && (
        <Card title={editing === "new" ? "New announcement" : "Edit announcement"}>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground/80">Type</span>
              <select value={draft.kind} onChange={(e) => set("kind", e.target.value as AnnouncementKind)} className={inputClass}>
                {announcementKinds.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground/80">Title</span>
              <input required maxLength={120} value={draft.title} onChange={(e) => set("title", e.target.value)} className={inputClass} placeholder="e.g. 10% off yearly plans this Diwali" />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-foreground/80">Message</span>
              <textarea rows={3} maxLength={1000} value={draft.body} onChange={(e) => set("body", e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground/80">Link (optional)</span>
              <input value={draft.linkUrl} maxLength={500} onChange={(e) => set("linkUrl", e.target.value)} className={inputClass} placeholder="https://… or /projects/new" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground/80">Button text</span>
              <input value={draft.linkLabel} maxLength={40} onChange={(e) => set("linkLabel", e.target.value)} className={inputClass} placeholder="Learn more" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground/80">Show from (optional)</span>
              <input type="date" value={draft.startsAt} onChange={(e) => set("startsAt", e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground/80">Show until (optional)</span>
              <input type="date" value={draft.endsAt} onChange={(e) => set("endsAt", e.target.value)} className={inputClass} />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={draft.published} onChange={(e) => set("published", e.target.checked)} /> Published (untick to keep it as a draft)
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" disabled={pending || !draft.title.trim()} className={buttonClass("primary")}>
                Save
              </button>
              <button type="button" onClick={() => setEditing(null)} className={buttonClass("ghost")}>
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <ul className="divide-y divide-foreground/10 overflow-hidden rounded-xl border border-foreground/[0.07] bg-surface shadow-sm">
        {items.map((a) => (
          <li key={a.id} className="flex items-start gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {a.title}
                <span className="ml-2 rounded-full bg-foreground/10 px-2 py-0.5 align-middle text-[11px] font-medium text-foreground/60">
                  {announcementKinds.find((k) => k.value === a.kind)?.label} · {statusOf(a)}
                </span>
              </p>
              {a.body && <p className="line-clamp-2 text-sm text-foreground/60">{a.body}</p>}
            </div>
            <button type="button" onClick={() => open(a)} className={buttonClass("ghost", "sm")}>
              <Pencil className="h-4 w-4" aria-hidden /> Edit
            </button>
            <button type="button" onClick={() => remove(a)} disabled={pending} className={buttonClass("ghost", "sm")}>
              <Trash2 className="h-4 w-4 text-critical" aria-hidden />
              <span className="sr-only">Delete</span>
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="px-4 py-6 text-center text-sm text-foreground/60">No announcements yet.</li>}
      </ul>
    </div>
  );
}
