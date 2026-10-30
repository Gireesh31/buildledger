"use client";

import { Banknote, CalendarClock, CircleAlert, CircleCheck, FileText, IndianRupee, Landmark, List, Plus, Smartphone, Trash2, type LucideIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { FormMessage, sendJson } from "@/components/auth/form";
import { buttonClass, inputClass } from "@/components/ui/primitives";
import { computeField, getCollection, isFieldVisible, type CollectionName, type FieldDef, type Option } from "@/lib/collections";
import { catalogs, type Catalog, type CatalogName } from "@/lib/catalogs";
import { formatINR, todayISO } from "@/lib/format";
import { parseMaterialBill, type MaterialValues } from "@/lib/material-parse";
import { scanBill } from "@/lib/ocr";
import type { AttachmentKind, LedgerRecord } from "@/lib/types";
import { AttachmentPicker } from "./AttachmentPicker";
import { CatalogPicker } from "./CatalogPicker";

export interface RecordFormProps {
  projectId: string;
  collection: CollectionName;
  record?: LedgerRecord;
  refOptions: Partial<Record<CollectionName, Option[]>>;
  attachmentKind?: AttachmentKind;
  /** Read bill photos with OCR and fill the form from them. */
  scan?: "material";
  /** Shop-style picture picker shown above the fields. */
  catalog?: CatalogName;
  /** Show "Add more" so several items can be entered and saved together. */
  multiple?: boolean;
  /** Called after saving, with how many items were saved. */
  onDone: (count: number) => void;
  onCancel: () => void;
  /** Called when some items were saved but a later one failed, so the list can show the saved ones. */
  onSaved?: () => void;
  /** Label for the secondary button (e.g. "Clear" when the form is always open). */
  cancelLabel?: string;
}

type ScanState =
  | { status: "idle" }
  | { status: "reading"; progress: number }
  | { status: "done"; filled: string[]; missing: string[]; billTotal: number | null; text: string }
  | { status: "failed"; message: string; text?: string };

type Values = Record<string, string>;

function initialValues(fields: readonly FieldDef[], record?: LedgerRecord): Values {
  const values: Values = {};
  for (const field of fields) {
    if (field.computed) continue;
    const existing = record?.[field.name];
    if (existing !== undefined) values[field.name] = String(existing);
    else if (field.defaultValue !== undefined) values[field.name] = field.defaultValue;
    else if (field.kind === "date") values[field.name] = todayISO();
    else if ((field.kind === "select" || field.kind === "radio") && field.required) values[field.name] = field.options?.[0]?.value ?? "";
    else values[field.name] = "";
  }
  return values;
}

export function RecordForm({ projectId, collection, record, refOptions, attachmentKind, scan, catalog, multiple, onDone, onCancel, onSaved, cancelLabel = "Cancel" }: RecordFormProps) {
  const def = getCollection(collection);
  // Text fields that only appear for "Other" in a dropdown (material name, vehicle name) are typed into that dropdown's own box.
  const otherText = new Map(
    def.fields
      .filter((f) => f.kind === "text" && f.showIf?.in.length === 1 && f.showIf.in[0] === "other")
      .map((f) => [f.showIf!.field, f] as const),
  );
  const otherTextNames = new Set([...otherText.values()].map((f) => f.name));
  // A new entry can hold several items ("Add more"), saved together; editing is always one item.
  const [items, setItems] = useState<Values[]>(() => [initialValues(def.fields, record)]);
  // The item the picture picker and bill scan fill in.
  const [active, setActive] = useState(0);
  const values = items[active] ?? items[0];
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
  // When a bill shows only its total, price per unit is worked out from the quantity the user types.
  const [billTotal, setBillTotal] = useState<number | null>(null);
  const [priceFromTotal, setPriceFromTotal] = useState(false);

  const updateItem = (index: number, change: (current: Values) => Values) =>
    setItems((list) => list.map((item, i) => (i === index ? change(item) : item)));

  function set(name: string, value: string, index = active) {
    updateItem(index, (current) => {
      const next = { ...current, [name]: value };
      // Choosing a material from the list fills in its usual unit (cement → bag, steel → ton …).
      const pickerDef: Catalog | undefined = catalog ? catalogs[catalog] : undefined;
      if (pickerDef && pickerDef.unitField && name === pickerDef.choiceField) {
        const unit = pickerDef.items.find((item) => item.value === value)?.unit;
        if (unit) next[pickerDef.unitField] = unit;
      }
      if (name === "quantity" && index === active && priceFromTotal && billTotal && Number(value) > 0) {
        next.unitPrice = String(Math.round((billTotal / Number(value)) * 100) / 100);
      }
      return next;
    });
    if (name === "unitPrice") setPriceFromTotal(false);
  }

  /** Adds another item below, starting from the same date so a day's purchases go in quickly. */
  function addItem() {
    const fresh = initialValues(def.fields);
    if (def.dateField && values[def.dateField]) fresh[def.dateField] = values[def.dateField];
    setItems((list) => [...list, fresh]);
    setActive(items.length);
    setBillTotal(null);
    setPriceFromTotal(false);
  }

  function removeItem(index: number) {
    setItems((list) => list.filter((_, i) => i !== index));
    setActive((current) => (current === index ? Math.max(0, index - 1) : current > index ? current - 1 : current));
  }

  /** Applies whichever parsed values were found; returns the labels of the fields it filled. */
  function applyMaterialValues(parsed: MaterialValues): string[] {
    const found = Object.entries(parsed).filter(([name, value]) => value && def.fields.some((f) => f.name === name)) as [string, string][];
    updateItem(active, (current) => ({ ...current, ...Object.fromEntries(found) }));
    return found.map(([name]) => def.fields.find((f) => f.name === name)!.label);
  }

  async function handleBillImage(file: File) {
    if (scan !== "material") return;
    if (!file.type.startsWith("image/") || file.type === "image/heic") {
      setScanState({ status: "failed", message: "Only JPG, PNG or WebP photos can be read automatically. The file is still attached." });
      return;
    }
    setScanState({ status: "reading", progress: 0 });
    try {
      const { result, text } = await scanBill(
        file,
        parseMaterialBill,
        (r) => Boolean(r.quantity && r.unitPrice),
        (progress) => setScanState({ status: "reading", progress }),
      );
      const filled = applyMaterialValues(result);
      const missing = (["quantity", "unitPrice"] as const)
        .filter((name) => !result[name])
        .map((name) => def.fields.find((f) => f.name === name)!.label);
      const total = result.billTotal && missing.length > 0 ? Number(result.billTotal) : null;
      setBillTotal(total);
      setPriceFromTotal(total !== null);
      setScanState(
        filled.length > 0 || total
          ? { status: "done", filled, missing, billTotal: total, text }
          : { status: "failed", message: "Couldn't find the material details on this bill. Please fill them in.", text },
      );
    } catch {
      setScanState({ status: "failed", message: "Couldn't read the bill (check your internet connection the first time). Please fill in the form." });
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const base = `/api/projects/${projectId}/records/${collection}`;
    let firstSavedId: string | undefined;
    // Items are saved one by one; if one fails, the saved ones leave the form so a retry doesn't duplicate them.
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const body = Object.fromEntries(def.fields.filter((f) => !f.computed && isFieldVisible(f, item)).map((f) => [f.name, item[f.name]]));
      const result = record ? await sendJson<LedgerRecord>(`${base}/${record.id}`, body, "PUT") : await sendJson<LedgerRecord>(base, body);
      if (!result.ok) {
        setItems((list) => list.slice(i));
        setActive(0);
        setError(items.length > 1 ? `Item ${i + 1}: ${result.error}${i > 0 ? ` (the ${i} item${i === 1 ? "" : "s"} before it were saved)` : ""}` : result.error);
        setPending(false);
        if (i > 0) onSaved?.();
        return;
      }
      firstSavedId ??= result.data.id;
    }

    // A bill or photos belong with the first item (one bill usually covers the whole purchase).
    for (const file of files) {
      const form = new FormData();
      form.set("file", file);
      form.set("kind", attachmentKind ?? "document");
      form.set("collection", collection);
      form.set("recordId", firstSavedId!);
      const upload = await fetch(`/api/projects/${projectId}/files`, { method: "POST", body: form });
      if (!upload.ok) {
        const data = await upload.json().catch(() => ({}));
        setError(`Saved, but "${file.name}" didn't upload: ${data.error ?? "upload failed"}`);
        setPending(false);
        setFiles([]);
        return;
      }
    }
    onDone(items.length);
  }

  return (
    <form onSubmit={handleSubmit} className="animate-scale-in flex flex-col gap-4 rounded-xl border border-foreground/[0.09] bg-surface p-5 shadow-sm">
      <h3 className="text-sm font-semibold">{record ? `Edit ${def.singular.toLowerCase()}` : `New ${def.singular.toLowerCase()}`}</h3>
      {error && <FormMessage tone="error">{error}</FormMessage>}

      {attachmentKind && scan && (
        <>
          <AttachmentPicker kind={attachmentKind} files={files} onChange={setFiles} onImageAdded={handleBillImage} />
          <ScanStatus state={scanState} />
        </>
      )}

      {catalog && (
        <CatalogPicker catalog={catalogs[catalog]} values={values} onChange={(changes) => Object.entries(changes).forEach(([name, value]) => set(name, value))} />
      )}

      {items.map((item, itemIndex) => {
        const many = items.length > 1;
        return (
          <div
            key={itemIndex}
            onFocusCapture={() => setActive(itemIndex)}
            onPointerDownCapture={() => setActive(itemIndex)}
            className={
              many
                ? `animate-fade-up flex flex-col gap-4 rounded-xl border-2 p-4 transition-colors ${itemIndex === active ? "border-brand/50 bg-brand-soft/30" : "border-foreground/[0.08]"}`
                : "flex flex-col gap-4"
            }
          >
            {many && (
              <div className="flex items-center justify-between gap-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs text-white">{itemIndex + 1}</span>
                  {def.singular} {itemIndex + 1}
                  {itemIndex === active && catalog && <span className="text-xs font-normal text-brand">· picker fills this one</span>}
                </h4>
                <button
                  type="button"
                  onClick={() => removeItem(itemIndex)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-foreground/60 hover:bg-critical/10 hover:text-critical"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
                </button>
              </div>
            )}

            {groupFields(def.fields.filter((field) => !field.computed && !otherTextNames.has(field.name) && isFieldVisible(field, item))).map(([group, fields], index, groups) => (
              <section key={group} className={groups.length > 1 ? "rounded-xl border border-foreground/[0.08] bg-surface p-4" : ""}>
                {groups.length > 1 && (
                  <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-[10px] text-brand">{index + 1}</span>
                    {group}
                  </h4>
                )}
                <div className={`grid gap-x-4 gap-y-3 sm:grid-cols-2 ${COLUMNS[fields.filter((f) => f.kind !== "radio" && f.kind !== "textarea").length] ?? "lg:grid-cols-3"}`}>
                  {fields.map((field) =>
                    field.kind === "radio" ? (
                      <RadioField
                        key={field.name}
                        field={field}
                        name={`${field.name}-${itemIndex}`}
                        value={item[field.name] ?? ""}
                        onChange={(v) => set(field.name, v, itemIndex)}
                      />
                    ) : otherText.has(field.name) && item[field.name] === "other" ? (
                      // "Other" chosen: the same box becomes a text box for its name.
                      <OtherNameInput
                        key={field.name}
                        field={field}
                        textField={otherText.get(field.name)!}
                        value={item[otherText.get(field.name)!.name] ?? ""}
                        onChange={(v) => set(otherText.get(field.name)!.name, v, itemIndex)}
                        onBackToList={() => set(field.name, "", itemIndex)}
                      />
                    ) : (
                      <label key={field.name} className={`flex flex-col gap-1.5 text-sm ${field.kind === "textarea" ? "col-span-full" : ""}`}>
                        <FieldLabel field={field} />
                        <FieldInput
                          field={field}
                          value={item[field.name] ?? ""}
                          onChange={(v) => set(field.name, v, itemIndex)}
                          options={field.ref ? refOptions[field.ref] : undefined}
                        />
                      </label>
                    ),
                  )}
                </div>
              </section>
            ))}

            {def.fields
              .filter((field) => field.computed)
              .map((field) => (
                <div
                  key={field.name}
                  className="flex items-baseline justify-between rounded-xl border border-foreground/[0.07] bg-foreground/[0.03] px-4 py-3"
                  aria-live="polite"
                >
                  <span className="text-sm font-medium text-foreground/70">{field.label}</span>
                  <span className="text-2xl font-semibold tabular-nums">{formatINR(computeField(def, field, item), true)}</span>
                </div>
              ))}

            {item.paymentStatus === "partial" && <BalanceDue total={def.fields.filter((f) => f.computed).reduce((s, f) => s + computeField(def, f, item), 0)} paid={Number(item.paidAmount) || 0} />}
          </div>
        );
      })}

      {multiple && !record && (
        <button
          type="button"
          onClick={addItem}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand/40 py-3 text-sm font-semibold text-brand transition-colors hover:border-brand hover:bg-brand-soft"
        >
          <Plus className="h-4 w-4" aria-hidden /> Add more <span className="font-normal text-foreground/60">(another {def.singular.toLowerCase()})</span>
        </button>
      )}

      {items.length > 1 &&
        def.fields
          .filter((field) => field.computed)
          .map((field) => (
            <div key={field.name} className="flex items-baseline justify-between rounded-xl bg-foreground px-4 py-3 text-background" aria-live="polite">
              <span className="text-sm font-medium">
                Grand total · {items.length} {def.label.toLowerCase()}
              </span>
              <span className="text-2xl font-semibold tabular-nums">
                {formatINR(
                  items.reduce((sum, item) => sum + computeField(def, field, item), 0),
                  true,
                )}
              </span>
            </div>
          ))}

      {attachmentKind && !scan && <AttachmentPicker kind={attachmentKind} files={files} onChange={setFiles} />}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={buttonClass("secondary")}>
          {cancelLabel}
        </button>
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? "Saving…" : items.length > 1 ? `Save all ${items.length}` : "Save"}
        </button>
      </div>
    </form>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  options,
}: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
  options?: Option[];
}) {
  const common = { value, required: field.required, className: inputClass, placeholder: field.placeholder };
  switch (field.kind) {
    case "textarea":
      return <textarea rows={3} {...common} onChange={(e) => onChange(e.target.value)} maxLength={2000} />;
    case "select":
    case "ref": {
      const list = field.kind === "ref" ? (options ?? []) : (field.options ?? []);
      return (
        <select {...common} onChange={(e) => onChange(e.target.value)}>
          {(!field.required || !value) && <option value="">{field.kind === "ref" && list.length === 0 ? "None added yet" : "Select…"}</option>}
          {list.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }
    case "money":
      return (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/50">₹</span>
          <input {...common} type="number" inputMode="decimal" min={0} step="0.01" onChange={(e) => onChange(e.target.value)} className={`${inputClass} pl-7`} />
        </div>
      );
    case "number":
      return <input {...common} type="number" inputMode="decimal" min={0} step="any" onChange={(e) => onChange(e.target.value)} />;
    case "date":
      return <input {...common} type="date" onChange={(e) => onChange(e.target.value)} />;
    case "phone":
      return <input {...common} type="tel" inputMode="tel" placeholder="98765 43210" onChange={(e) => onChange(e.target.value)} />;
    default:
      return <input {...common} maxLength={200} onChange={(e) => onChange(e.target.value)} />;
  }
}

/** A dropdown with "Other" chosen: its box turns into a text box for the name, with a way back to the list. */
function OtherNameInput({
  field,
  textField,
  value,
  onChange,
  onBackToList,
}: {
  field: FieldDef;
  textField: FieldDef;
  value: string;
  onChange: (value: string) => void;
  onBackToList: () => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <FieldLabel field={field} />
      <span className="relative flex items-center">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={textField.required}
          maxLength={200}
          autoFocus
          placeholder={textField.placeholder ? `Other: ${textField.placeholder}` : `Type the ${field.label.toLowerCase()} name`}
          aria-label={textField.label}
          className={`${inputClass} pr-24`}
        />
        <button
          type="button"
          onClick={onBackToList}
          className="absolute right-1.5 flex items-center gap-1 rounded-md bg-brand-soft px-2 py-1 text-xs font-medium text-brand hover:bg-brand hover:text-white"
        >
          <List className="h-3.5 w-3.5" aria-hidden /> List
        </button>
      </span>
    </label>
  );
}

/** Part paid: what was paid and the balance still due, worked out as you type. */
function BalanceDue({ total, paid }: { total: number; paid: number }) {
  const balance = Math.round((total - paid) * 100) / 100;
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-500/30 dark:bg-rose-500/10" aria-live="polite">
      <span className="text-sm text-foreground/70">
        Paid {formatINR(paid, true)} of {formatINR(total, true)}
      </span>
      {balance > 0 ? (
        <span className="text-right">
          <span className="block text-xs font-medium uppercase tracking-wide text-critical">Balance due</span>
          <span className="text-2xl font-semibold tabular-nums text-critical">{formatINR(balance, true)}</span>
        </span>
      ) : (
        <span className="text-sm font-medium text-critical">Amount paid must be less than the total. Choose “Paid” if it’s fully paid.</span>
      )}
    </div>
  );
}

function ScanStatus({ state }: { state: ScanState }) {
  if (state.status === "idle") return null;
  if (state.status === "reading") {
    return (
      <p className="text-xs text-foreground/70" role="status">
        Reading bill… {Math.round(state.progress * 100)}%
        {state.progress === 0 && " (the first scan downloads the reader, so it takes a little longer)"}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      {state.status === "done" ? (
        <FormMessage tone={state.missing.length === 0 ? "success" : "error"}>
          {state.filled.length > 0 && `Filled from bill: ${state.filled.join(", ")}. `}
          {state.missing.length === 0
            ? "Check the values before saving."
            : state.billTotal
              ? `Bill total ${formatINR(state.billTotal, true)} found. Enter the quantity and the price per unit is worked out from it.`
              : `Couldn't read: ${state.missing.join(", ")}. Please fill ${state.missing.length === 1 ? "it" : "them"} in.`}
        </FormMessage>
      ) : (
        <FormMessage tone="error">{state.message}</FormMessage>
      )}
      {state.text && (
        <details className="text-xs text-foreground/60">
          <summary className="cursor-pointer">Text read from the bill</summary>
          <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-foreground/5 p-2 font-mono">{state.text}</pre>
        </details>
      )}
    </div>
  );
}

const CHOICE_ICONS: Record<string, LucideIcon> = {
  upi: Smartphone,
  cash: Banknote,
  netbanking: Landmark,
  cheque: FileText,
  advance: CalendarClock,
  paid: CircleCheck,
  partial: IndianRupee,
  due: CircleAlert,
};

/** A select shown as a row of choice buttons (real radio inputs underneath, so keyboard and screen readers work). */
function RadioField({ field, name, value, onChange }: { field: FieldDef; name: string; value: string; onChange: (value: string) => void }) {
  return (
    <fieldset className="col-span-full flex flex-col gap-1.5 text-sm">
      <legend className="mb-1.5">
        <FieldLabel field={field} />
      </legend>
      <div className="flex flex-wrap gap-2">
        {field.options?.map((option) => {
          const Icon = CHOICE_ICONS[option.value];
          return (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                required={field.required}
                className="peer sr-only"
              />
              <span className="flex items-center gap-1.5 rounded-full border border-foreground/15 bg-surface px-3.5 py-2 text-sm transition-all duration-200 hover:border-brand/50 peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40">
                {Icon && <Icon className="h-4 w-4" aria-hidden />}
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// Columns on wide screens by number of text boxes in the panel, so rows end up full.
const COLUMNS: Record<number, string> = { 1: "lg:grid-cols-2", 2: "lg:grid-cols-2", 4: "lg:grid-cols-4" };

function FieldLabel({ field }: { field: FieldDef }) {
  return (
    <span className="font-medium text-foreground/80">
      {field.label}
      {field.required && <span className="text-critical"> *</span>}
    </span>
  );
}

/**
 * Splits fields into their form panels, keeping the order they're defined in.
 * Text boxes come before choice buttons inside a panel so columns line up,
 * except a choice that controls which fields show (like "Charged"), which stays first.
 */
function groupFields(fields: FieldDef[]): [string, FieldDef[]][] {
  const groups = new Map<string, FieldDef[]>();
  for (const field of fields) {
    const name = field.group ?? "Details";
    groups.set(name, [...(groups.get(name) ?? []), field]);
  }
  return [...groups].map(([name, list]) => {
    const controls = new Set(fields.flatMap((f) => (f.showIf ? [f.showIf.field] : [])));
    const leading = list.filter((f) => f.kind === "radio" && controls.has(f.name));
    const inputs = list.filter((f) => f.kind !== "radio");
    const choices = list.filter((f) => f.kind === "radio" && !controls.has(f.name));
    return [name, [...leading, ...inputs, ...choices]];
  });
}
