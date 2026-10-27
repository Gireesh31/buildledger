"use client";

import { Camera, Upload } from "lucide-react";
import { buttonClass } from "@/components/ui/primitives";
import { useEffect, useMemo, useRef } from "react";
import { formatFileSize } from "@/lib/format";
import type { AttachmentKind } from "@/lib/types";

/**
 * Camera / file picker for bills and site photos. Files are held locally and uploaded
 * once the record is saved, so they can be linked to it.
 */
export function AttachmentPicker({
  kind,
  files,
  onChange,
  onImageAdded,
}: {
  kind: AttachmentKind;
  files: File[];
  onChange: (files: File[]) => void;
  /** Called with the newly added file, e.g. to read a bill with OCR. */
  onImageAdded?: (file: File) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((file) => (file.type.startsWith("image/") ? URL.createObjectURL(file) : null)), [files]);
  useEffect(() => () => previews.forEach((url) => url && URL.revokeObjectURL(url)), [previews]);

  const add = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const added = Array.from(list);
    onChange([...files, ...added]);
    onImageAdded?.(added[added.length - 1]);
  };
  const isBill = kind === "bill";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-foreground/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground/80">{isBill ? "Bill / receipt" : "Site photos"}</span>
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className={buttonClass("primary", "sm")}
        >
          <Camera className="h-3.5 w-3.5" aria-hidden /> {isBill ? "Scan bill" : "Take photo"}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={buttonClass("secondary", "sm")}
        >
          <Upload className="h-3.5 w-3.5" aria-hidden /> Upload file
        </button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={fileRef}
          type="file"
          accept={isBill ? "image/*,application/pdf" : "image/*"}
          multiple
          className="hidden"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {isBill && files.length > 0 && !onImageAdded && (
        <p className="text-xs text-foreground/60">Check the amount and bill number against the photo before saving.</p>
      )}
      {isBill && onImageAdded && files.length === 0 && (
        <p className="text-xs text-foreground/60">Scan a printed bill and the form below fills in automatically.</p>
      )}
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="relative w-28 rounded-md border border-foreground/10 p-1 text-xs">
              {previews[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previews[i]!} alt={file.name} className="h-20 w-full rounded object-cover" />
              ) : (
                <div className="flex h-20 items-center justify-center rounded bg-foreground/5 font-medium">PDF</div>
              )}
              <p className="mt-1 truncate" title={file.name}>
                {file.name}
              </p>
              <p className="text-foreground/50">{formatFileSize(file.size)}</p>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                aria-label={`Remove ${file.name}`}
                className="absolute right-1 top-1 rounded bg-background/90 px-1.5 text-foreground/70 hover:text-foreground"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
