"use client";

import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { FormMessage, sendJson } from "@/components/auth/form";
import { buttonClass, Card, inputClass } from "@/components/ui/primitives";
import { ANNOUNCEMENT_MEDIA_TYPES, announcementKinds, MAX_ANNOUNCEMENT_MEDIA, type Announcement, type AnnouncementKind, type AnnouncementMedia } from "@/lib/app-config";

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
  media: AnnouncementMedia[];
}

const empty: Draft = { kind: "news", title: "", body: "", linkUrl: "", linkLabel: "", startsAt: "", endsAt: "", published: true, media: [] };

/** Sends one file straight to storage with the one-time URL the server hands out. */
async function uploadMedia(file: File): Promise<AnnouncementMedia> {
  const start = await sendJson<AnnouncementMedia & { uploadUrl: string }>("/api/admin/announcements/media", { contentType: file.type, size: file.size }, "POST");
  if (!start.ok) throw new Error(start.error);
  const form = new FormData();
  form.append("cacheControl", "3600");
  form.append("", file);
  const response = await fetch(start.data.uploadUrl, { method: "PUT", body: form, headers: { "x-upsert": "false" } }).catch(() => null);
  if (!response?.ok) throw new Error(`Couldn't upload ${file.name}. Check your connection and try again.`);
  return { type: start.data.type, path: start.data.path, url: start.data.url };
}

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
  media: a.media ?? [],
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
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_ANNOUNCEMENT_MEDIA - draft.media.length;
    const chosen = [...files].slice(0, room);
    setMessage(chosen.length < files.length ? { tone: "error", text: `Up to ${MAX_ANNOUNCEMENT_MEDIA} images or videos per announcement.` } : null);
    for (const file of chosen) {
      const kind = ANNOUNCEMENT_MEDIA_TYPES[file.type];
      if (!kind) return setMessage({ tone: "error", text: `${file.name}: use a JPG, PNG, WebP or GIF image, or an MP4, MOV or WebM video.` });
      if (file.size > kind.maxBytes) return setMessage({ tone: "error", text: `${file.name} is too big: ${kind.type === "video" ? "videos" : "images"} can be up to ${kind.maxBytes / 1024 / 1024} MB.` });
    }
    setUploading(true);
    try {
      for (const file of chosen) {
        const media = await uploadMedia(file);
        setDraft((d) => ({ ...d, media: [...d.media, media] }));
      }
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof Error ? e.message : "Upload failed." });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function open(target: Announcement | "new") {
    setMessage(null);
    setEditing(target === "new" ? "new" : target.id);
    setDraft(target === "new" ? empty : draftOf(target));
  }

  async function save() {
    setPending(true);
    setMessage(null);
    const body = { ...draft, startsAt: fromDay(draft.startsAt, false), endsAt: fromDay(draft.endsAt, true), media: draft.media.map(({ type, path }) => ({ type, path })) };
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
            <div className="flex flex-col gap-2 text-sm sm:col-span-2">
              <span className="font-medium text-foreground/80">Images & videos (optional, up to {MAX_ANNOUNCEMENT_MEDIA})</span>
              {draft.media.length > 0 && (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {draft.media.map((m) => (
                    <li key={m.path} className="relative overflow-hidden rounded-lg border border-foreground/10 bg-foreground/5">
                      {m.type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt="" className="aspect-video w-full object-cover" />
                      ) : (
                        <video src={m.url} className="aspect-video w-full object-cover" muted playsInline controls preload="metadata" />
                      )}
                      <button
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, media: d.media.filter((x) => x.path !== m.path) }))}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                        aria-label="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <input
                ref={fileInput}
                type="file"
                multiple
                accept={Object.keys(ANNOUNCEMENT_MEDIA_TYPES).join(",")}
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
              <div>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading || draft.media.length >= MAX_ANNOUNCEMENT_MEDIA}
                  className={buttonClass("secondary", "sm")}
                >
                  <ImagePlus className="h-4 w-4" aria-hidden /> {uploading ? "Uploading…" : "Add image or video"}
                </button>
                <span className="ml-2 text-xs text-foreground/60">Images up to 5 MB, videos up to 50 MB.</span>
              </div>
            </div>
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
              <button type="submit" disabled={pending || uploading || !draft.title.trim()} className={buttonClass("primary")}>
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
              {a.media.length > 0 && (
                <p className="text-xs text-foreground/50">
                  {a.media.filter((m) => m.type === "image").length} images · {a.media.filter((m) => m.type === "video").length} videos
                </p>
              )}
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
