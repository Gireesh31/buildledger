"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { PaymentStatusBadge } from "@/components/ui/PaymentStatusBadge";
import { buttonClass, EmptyState, inputClass } from "@/components/ui/primitives";
import { choiceLabel, getCollection, type CollectionName, type FieldDef, type Option } from "@/lib/collections";
import type { CatalogName } from "@/lib/catalogs";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import type { Attachment, AttachmentKind, LedgerRecord } from "@/lib/types";
import { RecordForm, type VoiceMode } from "./RecordForm";

interface RecordManagerProps {
  projectId: string;
  collection: CollectionName;
  records: LedgerRecord[];
  refOptions?: Partial<Record<CollectionName, Option[]>>;
  canEdit: boolean;
  attachments?: Attachment[];
  attachmentKind?: AttachmentKind;
  voice?: VoiceMode;
  scan?: "material";
  /** Shop-style picture picker in the form. */
  catalog?: CatalogName;
  /** Let a new entry hold several items ("Add more"). */
  multiple?: boolean;
  title?: string;
  emptyText?: string;
  /** Calculated columns from the page, e.g. a worker's amount due. Keyed by record id. */
  extraColumns?: ExtraColumn[];
}

export interface ExtraColumn {
  label: string;
  values: Record<string, { text: string; tone?: "critical" }>;
}

/** Add / edit / delete / search for one project ledger, driven by its collection definition. */
export function RecordManager({
  projectId,
  collection,
  records,
  refOptions = {},
  canEdit,
  attachments = [],
  attachmentKind,
  voice,
  scan,
  catalog,
  multiple,
  title,
  emptyText,
  extraColumns = [],
}: RecordManagerProps) {
  const def = getCollection(collection);
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [editing, setEditing] = useState<LedgerRecord | "new" | null>(null);
  const [query, setQuery] = useState("");

  const refLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const list of Object.values(refOptions)) for (const option of list ?? []) map.set(option.value, option.label);
    return map;
  }, [refOptions]);

  const filesByRecord = useMemo(() => {
    const map = new Map<string, Attachment[]>();
    for (const a of attachments) if (a.recordId) map.set(a.recordId, [...(map.get(a.recordId) ?? []), a]);
    return map;
  }, [attachments]);

  // Conditional fields (e.g. daily wage vs team amount) get a column too and show "—" where they don't apply.
  const columns = def.fields.filter((f) => !f.hideInTable);
  // Only total the amount column when every row has one.
  const moneyField = def.fields.find((f) => f.kind === "money" && f.name === "amount" && !f.showIf);

  const display = (field: FieldDef, record: LedgerRecord): string => {
    const value = record[field.name];
    if (value === undefined || value === "") return "—";
    switch (field.kind) {
      case "money":
        return formatINR(Number(value), true);
      case "number":
        return formatNumber(Number(value));
      case "date":
        return formatDate(String(value));
      case "select":
      case "radio":
        return choiceLabel(def, field, record);
      case "ref":
        return refLabels.get(String(value)) ?? "(deleted)";
      default:
        return String(value);
    }
  };


  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...records].sort((a, b) =>
      def.dateField
        ? String(b[def.dateField]).localeCompare(String(a[def.dateField])) || b.createdAt.localeCompare(a.createdAt)
        : String(a[def.titleField] ?? "").localeCompare(String(b[def.titleField] ?? "")),
    );
    if (!q) return sorted;
    return sorted.filter((record) =>
      def.fields.some((field) => display(field, record).toLowerCase().includes(q)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, query, refLabels]);

  const total = moneyField ? visible.reduce((sum, r) => sum + (typeof r.amount === "number" ? r.amount : 0), 0) : 0;

  function done() {
    setEditing(null);
    startTransition(() => router.refresh());
  }

  async function remove(record: LedgerRecord) {
    if (!confirm(`Delete this ${def.singular.toLowerCase()}? This can't be undone.`)) return;
    const response = await fetch(`/api/projects/${projectId}/records/${collection}/${record.id}`, { method: "DELETE" });
    if (!response.ok) {
      alert((await response.json().catch(() => ({}))).error ?? "Couldn't delete.");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">
          {title ?? def.label} <span className="text-sm font-normal text-foreground/50">({records.length})</span>
        </h2>
        <div className="no-print flex flex-wrap items-center gap-2">
          {records.length > 5 && (
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              aria-label={`Search ${def.label.toLowerCase()}`}
              className={`${inputClass} w-40 py-1.5`}
            />
          )}
          {canEdit && editing === null && (
            <button onClick={() => setEditing("new")} className={buttonClass("primary", "sm")}>
              <Plus className="h-3.5 w-3.5" aria-hidden /> Add {def.singular.toLowerCase()}
            </button>
          )}
        </div>
      </div>

      {editing !== null && (
        <RecordForm
          key={editing === "new" ? "new" : editing.id}
          projectId={projectId}
          collection={collection}
          record={editing === "new" ? undefined : editing}
          refOptions={refOptions}
          voice={voice}
          scan={scan}
          catalog={catalog}
          multiple={multiple}
          attachmentKind={attachmentKind}
          onDone={done}
          onCancel={() => setEditing(null)}
          onSaved={() => startTransition(() => router.refresh())}
        />
      )}

      {records.length === 0 ? (
        <EmptyState>{emptyText ?? `No ${def.label.toLowerCase()} yet.`}</EmptyState>
      ) : (
        <>
        {/* Phones: one card per entry, so nothing hides off the side of a wide table. */}
        <ul className={`flex flex-col gap-2 transition-opacity sm:hidden ${refreshing ? "opacity-60" : ""}`}>
          {visible.map((record) => {
            // A long text "title" (daily log's work done) reads better in full below the date.
            const namedField = def.fields.find((f) => f.name === def.titleField);
            const dateAsTitle = namedField?.kind === "textarea";
            const titleField = dateAsTitle ? def.fields.find((f) => f.name === def.dateField) : namedField;
            const dateField = dateAsTitle ? undefined : def.fields.find((f) => f.name === def.dateField);
            const detailFields = columns.filter(
              (f) => f !== titleField && f !== dateField && f.name !== "paymentStatus" && f !== moneyField && display(f, record) !== "—",
            );
            const files = filesByRecord.get(record.id) ?? [];
            return (
              <li key={record.id} className="rounded-2xl border border-foreground/[0.07] bg-surface p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{titleField ? display(titleField, record) : def.singular}</p>
                    {dateField && <p className="text-xs text-foreground/55">{display(dateField, record)}</p>}
                  </div>
                  {record.paymentStatus ? <PaymentStatusBadge status={String(record.paymentStatus)} /> : null}
                </div>
                {detailFields.length > 0 && (
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                    {detailFields.map((field) => (
                      <div key={field.name} className={`min-w-0 ${field.kind === "textarea" ? "col-span-2" : ""}`}>
                        <dt className="text-xs text-foreground/50">{field.label}</dt>
                        <dd className={`break-words ${field.kind === "textarea" ? "whitespace-pre-line" : ""} ${field.kind === "money" || field.kind === "number" ? "tabular-nums" : ""}`}>
                          {display(field, record)}
                        </dd>
                      </div>
                    ))}
                    {extraColumns.map((column) => {
                      const cell = column.values[record.id];
                      return cell ? (
                        <div key={column.label} className="min-w-0">
                          <dt className="text-xs text-foreground/50">{column.label}</dt>
                          <dd className={`font-medium tabular-nums ${cell.tone === "critical" ? "text-critical" : ""}`}>{cell.text}</dd>
                        </div>
                      ) : null;
                    })}
                  </dl>
                )}
                {files.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {files.map((file, i) => (
                      <a
                        key={file.id}
                        href={`/api/projects/${projectId}/files/${file.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md bg-rose-100 px-2 py-1 text-xs text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                      >
                        {file.mimeType === "application/pdf" ? "PDF" : "📷"} {i + 1}
                      </a>
                    ))}
                  </div>
                )}
                {(moneyField || canEdit) && (
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-foreground/[0.07] pt-3">
                    <span className="text-lg font-semibold tabular-nums">{moneyField ? display(moneyField, record) : ""}</span>
                    {canEdit && (
                      <span className="flex gap-1">
                        <button onClick={() => setEditing(record)} className={buttonClass("secondary", "sm")}>
                          Edit
                        </button>
                        <button onClick={() => remove(record)} className="rounded-lg px-3 py-1.5 text-sm text-critical hover:bg-critical/10">
                          Delete
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
          {moneyField && visible.length > 0 && (
            <li className="flex items-center justify-between rounded-2xl bg-brand px-4 py-3 font-semibold text-white shadow-sm shadow-brand/30">
              <span>{query ? "Total (filtered)" : "Total"}</span>
              <span className="tabular-nums">{formatINR(total, true)}</span>
            </li>
          )}
        </ul>
        <div className={`hidden overflow-x-auto rounded-2xl border border-foreground/[0.07] bg-surface shadow-sm transition-opacity sm:block ${refreshing ? "opacity-60" : ""}`}>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-brand-soft/60 text-left text-xs text-foreground/70">
              <tr>
                {columns.map((field) => (
                  <th key={field.name} className={`px-3 py-2 font-medium ${field.kind === "money" || field.kind === "number" ? "text-right" : ""}`}>
                    {field.label}
                  </th>
                ))}
                {extraColumns.map((column) => (
                  <th key={column.label} className="px-3 py-2 text-right font-medium">
                    {column.label}
                  </th>
                ))}
                {attachmentKind && <th className="px-3 py-2 font-medium">{attachmentKind === "bill" ? "Bill" : "Photos"}</th>}
                {canEdit && <th className="px-3 py-2" aria-label="Actions" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10">
              {visible.map((record) => (
                <tr key={record.id} className="align-top transition-colors hover:bg-brand-soft/40">
                  {columns.map((field) => (
                    <td
                      key={field.name}
                      className={`px-3 py-2 ${field.kind === "money" || field.kind === "number" ? "text-right tabular-nums" : ""} ${
                        field.kind === "textarea" ? "max-w-xs whitespace-pre-line" : ""
                      }`}
                    >
                      {field.name === "paymentStatus" && record.paymentStatus ? (
                        <PaymentStatusBadge status={String(record.paymentStatus)} />
                      ) : (
                        display(field, record)
                      )}
                    </td>
                  ))}
                  {extraColumns.map((column) => {
                    const cell = column.values[record.id];
                    return (
                      <td key={column.label} className={`px-3 py-2 text-right font-medium tabular-nums ${cell?.tone === "critical" ? "text-critical" : ""}`}>
                        {cell?.text ?? "—"}
                      </td>
                    );
                  })}
                  {attachmentKind && (
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {(filesByRecord.get(record.id) ?? []).map((file, i) => (
                          <a
                            key={file.id}
                            href={`/api/projects/${projectId}/files/${file.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md bg-rose-100 px-1.5 py-0.5 text-xs text-rose-700 hover:underline dark:bg-rose-500/15 dark:text-rose-300"
                            title={file.fileName}
                          >
                            {file.mimeType === "application/pdf" ? "PDF" : "📷"} {i + 1}
                          </a>
                        ))}
                      </div>
                    </td>
                  )}
                  {canEdit && (
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <button onClick={() => setEditing(record)} className="text-xs text-foreground/70 hover:underline">
                        Edit
                      </button>
                      <button onClick={() => remove(record)} className="ml-3 text-xs text-critical hover:underline">
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            {moneyField && visible.length > 0 && (
              <tfoot className="border-t border-foreground/15 font-semibold">
                <tr>
                  {columns.map((field, i) => (
                    <td key={field.name} className={`px-3 py-2 ${field.name === "amount" ? "text-right tabular-nums" : ""}`}>
                      {field.name === "amount" ? formatINR(total, true) : i === 0 ? (query ? "Total (filtered)" : "Total") : ""}
                    </td>
                  ))}
                  {extraColumns.map((column) => (
                    <td key={column.label} />
                  ))}
                  {attachmentKind && <td />}
                  {canEdit && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        </>
      )}
    </section>
  );
}

