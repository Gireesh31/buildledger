"use client";

import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { buttonClass } from "@/components/ui/primitives";
import type { CollectionName } from "@/lib/collections";

const EXPORTS: { collection: CollectionName; label: string }[] = [
  { collection: "materials", label: "Material purchases" },
  { collection: "workers", label: "Workers & teams" },
  { collection: "attendance", label: "Attendance" },
  { collection: "transport", label: "Transport" },
  { collection: "dailyLogs", label: "Daily log" },
];

/** One button per project list, each downloading it as a PDF table. */
export function ExportPdfButtons({ projectId, projectName }: { projectId: string; projectName: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXPORTS.map(({ collection, label }) => (
        <ExportPdfButton key={collection} projectId={projectId} projectName={projectName} collection={collection} title={label} label={label} />
      ))}
    </div>
  );
}

/** Downloads one list as a PDF; used on each list page. */
export function ExportPdfButton({
  projectId,
  projectName,
  collection,
  title,
  label = "Download PDF",
}: {
  projectId: string;
  projectName: string;
  collection: CollectionName;
  /** Heading and file name of the PDF. */
  title: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function download() {
    setBusy(true);
    setError(false);
    try {
      const { downloadCollectionPdf } = await import("@/lib/export-pdf");
      await downloadCollectionPdf(projectId, projectName, collection, title);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" onClick={download} disabled={busy} className={buttonClass("secondary", "sm")}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <FileDown className="h-3.5 w-3.5 text-brand" aria-hidden />}
        {label}
      </button>
      {error && <span className="text-xs text-critical">Couldn&apos;t create the PDF. Please try again.</span>}
    </span>
  );
}
