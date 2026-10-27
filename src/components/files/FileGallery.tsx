"use client";

import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { FormMessage } from "@/components/auth/form";
import { buttonClass, EmptyState, inputClass } from "@/components/ui/primitives";
import { formatDate, formatFileSize } from "@/lib/format";
import type { Attachment, AttachmentKind } from "@/lib/types";

const KIND_LABELS: Record<AttachmentKind, string> = { bill: "Bills", photo: "Site photos", document: "Documents" };

export function FileGallery({ projectId, files, canEdit }: { projectId: string; files: Attachment[]; canEdit: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [kind, setKind] = useState<AttachmentKind>("bill");
  const [caption, setCaption] = useState("");
  const [filter, setFilter] = useState<AttachmentKind | "all">("all");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(list: FileList | File[] | null) {
    const selected = Array.from(list ?? []);
    if (selected.length === 0) return;
    setPending(true);
    setMessage(null);
    const failures: string[] = [];
    for (const file of selected) {
      const form = new FormData();
      form.set("file", file);
      form.set("kind", kind);
      if (caption) form.set("caption", caption);
      const response = await fetch(`/api/projects/${projectId}/files`, { method: "POST", body: form });
      if (!response.ok) failures.push(`${file.name}: ${(await response.json().catch(() => ({}))).error ?? "failed"}`);
    }
    setPending(false);
    setCaption("");
    setMessage(
      failures.length > 0
        ? { tone: "error", text: failures.join(" · ") }
        : { tone: "success", text: `${selected.length} file${selected.length === 1 ? "" : "s"} uploaded.` },
    );
    startTransition(() => router.refresh());
  }

  async function remove(file: Attachment) {
    if (!confirm(`Delete ${file.fileName}?`)) return;
    const response = await fetch(`/api/projects/${projectId}/files/${file.id}`, { method: "DELETE" });
    if (response.ok) startTransition(() => router.refresh());
  }

  const shown = files.filter((f) => filter === "all" || f.kind === filter);

  return (
    <div className="flex flex-col gap-6">
      {canEdit && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            upload(e.dataTransfer.files);
          }}
          className={`flex flex-col gap-3 rounded-xl border-2 border-dashed p-5 ${dragging ? "border-brand bg-brand-soft" : "border-brand/25 bg-brand-soft/30"}`}
        >
          <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground/80">Type</span>
              <select value={kind} onChange={(e) => setKind(e.target.value as AttachmentKind)} className={inputClass}>
                <option value="bill">Bill / receipt</option>
                <option value="photo">Site photo</option>
                <option value="document">Document</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground/80">Caption (optional)</span>
              <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={200} placeholder="e.g. Steel delivery, 12 Oct" className={inputClass} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={pending} onClick={() => cameraRef.current?.click()} className={buttonClass("primary", "sm")}>
              <Camera className="h-3.5 w-3.5" aria-hidden /> {kind === "bill" ? "Scan bill" : "Take photo"}
            </button>
            <button type="button" disabled={pending} onClick={() => fileRef.current?.click()} className={buttonClass("secondary", "sm")}>
              Choose files
            </button>
            <span className="text-xs text-foreground/50">{pending ? "Uploading…" : "or drop files here · JPG, PNG, WebP, HEIC, PDF · max 10 MB"}</span>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => upload(e.target.files)} />
          <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
          {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
        </div>
      )}

      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter files">
        {(["all", "bill", "photo", "document"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={filter === k}
            onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 text-xs ${filter === k ? "bg-brand text-white shadow-sm shadow-brand/30" : "bg-foreground/5 hover:bg-brand-soft"}`}
          >
            {k === "all" ? "All" : KIND_LABELS[k]} ({k === "all" ? files.length : files.filter((f) => f.kind === k).length})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState>No files yet.</EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((file) => {
            const url = `/api/projects/${projectId}/files/${file.id}`;
            const isImage = file.mimeType.startsWith("image/") && file.mimeType !== "image/heic";
            return (
              <li key={file.id} className="animate-fade-up lift flex flex-col overflow-hidden rounded-2xl border border-foreground/[0.07] bg-surface shadow-sm">
                <a href={url} target="_blank" rel="noreferrer" className="block aspect-[4/3] bg-foreground/5">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={file.caption ?? file.fileName} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-sm font-semibold text-foreground/60">
                      {file.mimeType === "application/pdf" ? "PDF" : "HEIC"}
                    </span>
                  )}
                </a>
                <div className="flex flex-1 flex-col gap-0.5 p-2 text-xs">
                  <p className="truncate font-medium" title={file.caption ?? file.fileName}>
                    {file.caption ?? file.fileName}
                  </p>
                  <p className="text-foreground/50">
                    {KIND_LABELS[file.kind]} · {formatDate(file.createdAt)} · {formatFileSize(file.size)}
                    {file.collection && ` · linked to ${({ dailyLogs: "daily log", materials: "material", transport: "transport" } as Record<string, string>)[file.collection] ?? file.collection}`}
                  </p>
                  <div className="mt-auto flex gap-3 pt-1">
                    <a href={`${url}?download`} className="hover:underline">
                      Download
                    </a>
                    {canEdit && (
                      <button onClick={() => remove(file)} className="text-critical hover:underline">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
