"use client";

import { Archive, ArchiveRestore, Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { FormMessage, sendJson } from "@/components/auth/form";
import { buttonClass, Card, inputClass } from "@/components/ui/primitives";
import type { AppConfig } from "@/lib/app-config";
import type { CollectionName, CustomField, CustomFieldKind, FormConfig, Option } from "@/lib/collections";
import {
  choiceFieldsOf,
  choiceRows,
  customFieldsOf,
  customKinds,
  editableForms,
  fieldLabel,
  formLabel,
  newChoiceValue,
  newCustomFieldName,
  parseChoiceList,
  takesCustomFields,
  withChoiceRows,
  withCustomFields,
} from "@/lib/form-editor";

export function FormsEditor({ initial }: { initial: FormConfig }) {
  const [forms, setForms] = useState<FormConfig>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [tab, setTab] = useState<CollectionName>("materials");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const dirty = JSON.stringify(forms) !== saved;

  async function save() {
    setPending(true);
    setMessage(null);
    const result = await sendJson<AppConfig>("/api/admin/settings", { forms }, "PUT");
    setPending(false);
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    setForms(result.data.forms);
    setSaved(JSON.stringify(result.data.forms));
    setMessage({ tone: "success", text: "Saved. The forms on the website and in the app now use these choices and fields." });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Form">
          {editableForms.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={`rounded-full px-3.5 py-2 text-sm transition-colors ${tab === name ? "bg-foreground font-medium text-background" : "text-foreground/70 hover:bg-brand-soft"}`}
            >
              {formLabel(name)}
            </button>
          ))}
        </div>
        <button type="button" onClick={save} disabled={pending || !dirty} className={buttonClass("primary")}>
          <Save className="h-4 w-4" aria-hidden /> {dirty ? "Save changes" : "Saved"}
        </button>
      </div>
      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}

      {choiceFieldsOf(tab).map(({ field }) => (
        <ChoiceEditor key={`${tab}.${field}`} forms={forms} setForms={setForms} collection={tab} field={field} />
      ))}
      {takesCustomFields(tab) && <CustomFieldsEditor forms={forms} setForms={setForms} collection={tab} />}
    </div>
  );
}

interface EditorProps {
  forms: FormConfig;
  setForms: (forms: FormConfig) => void;
  collection: CollectionName;
}

function ChoiceEditor({ forms, setForms, collection, field }: EditorProps & { field: string }) {
  const rows = choiceRows(forms, collection, field);
  const [newLabel, setNewLabel] = useState("");
  const update = (next: typeof rows) => setForms(withChoiceRows(forms, collection, field, next));

  function add() {
    const label = newLabel.trim();
    if (!label) return;
    update([...rows, { value: newChoiceValue(rows, label), label, builtIn: false, locked: false, hidden: false }]);
    setNewLabel("");
  }

  return (
    <Card title={`${fieldLabel(collection, field)} choices`}>
      <p className="-mt-2 mb-3 text-xs text-foreground/60">Rename, hide or add choices. Hidden choices stop showing in the form; older entries keep them.</p>
      <ul className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <li key={row.value} className="flex items-center gap-2">
            <input
              value={row.label}
              maxLength={60}
              onChange={(e) => update(rows.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))}
              className={`${inputClass} ${row.hidden ? "line-through opacity-60" : ""}`}
              aria-label={`Name of choice ${i + 1}`}
            />
            {!row.builtIn && <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">Added</span>}
            <button
              type="button"
              disabled={row.locked}
              onClick={() => update(rows.map((r, j) => (j === i ? { ...r, hidden: !r.hidden } : r)))}
              className={buttonClass("ghost", "sm")}
              title={row.locked ? "This choice can be renamed but not hidden" : row.hidden ? "Show in the form" : "Hide from the form"}
            >
              {row.hidden ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              <span className="sr-only">{row.hidden ? "Show" : "Hide"}</span>
            </button>
            {!row.builtIn && (
              <button type="button" onClick={() => update(rows.filter((_, j) => j !== i))} className={buttonClass("ghost", "sm")} title="Remove (use Hide if entries already use it)">
                <Trash2 className="h-4 w-4 text-critical" aria-hidden />
                <span className="sr-only">Remove</span>
              </button>
            )}
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input value={newLabel} maxLength={60} onChange={(e) => setNewLabel(e.target.value)} placeholder="New choice, e.g. Fly ash bricks" className={inputClass} aria-label="New choice" />
        <button type="submit" disabled={!newLabel.trim()} className={buttonClass("secondary")}>
          <Plus className="h-4 w-4" aria-hidden /> Add
        </button>
      </form>
    </Card>
  );
}

function CustomFieldsEditor({ forms, setForms, collection }: EditorProps) {
  const fields = customFieldsOf(forms, collection);
  const update = (next: CustomField[]) => setForms(withCustomFields(forms, collection, next));
  const change = (i: number, patch: Partial<CustomField>) => update(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));

  function add() {
    update([...fields, { name: newCustomFieldName(collection, fields, "New field"), label: "New field", kind: "text" }]);
  }

  return (
    <Card
      title="Extra fields"
      action={
        <button type="button" onClick={add} disabled={fields.length >= 20} className={buttonClass("secondary", "sm")}>
          <Plus className="h-4 w-4" aria-hidden /> Add field
        </button>
      }
    >
      <p className="-mt-2 mb-3 text-xs text-foreground/60">
        Your own fields, shown under “More details” in the {formLabel(collection).toLowerCase()} form and in exports. Archive a field to take it off the form and keep what was entered.
      </p>
      {fields.length === 0 && <p className="text-sm text-foreground/60">No extra fields yet.</p>}
      <ul className="flex flex-col gap-4">
        {fields.map((f, i) => (
          <li key={f.name} className={`rounded-lg border border-foreground/10 p-3 ${f.archived ? "opacity-60" : ""}`}>
            <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-foreground/80">Name</span>
                <input value={f.label} maxLength={60} onChange={(e) => change(i, { label: e.target.value })} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-foreground/80">Type</span>
                <select
                  value={f.kind}
                  onChange={(e) => {
                    const kind = e.target.value as CustomFieldKind;
                    change(i, { kind, options: kind === "select" ? (f.options ?? []) : undefined });
                  }}
                  className={inputClass}
                >
                  {customKinds.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <input type="checkbox" checked={Boolean(f.required)} onChange={(e) => change(i, { required: e.target.checked || undefined })} /> Required
                </label>
                <button type="button" onClick={() => change(i, { archived: !f.archived || undefined })} className={buttonClass("ghost", "sm")} title={f.archived ? "Put back on the form" : "Archive"}>
                  {f.archived ? <ArchiveRestore className="h-4 w-4" aria-hidden /> : <Archive className="h-4 w-4" aria-hidden />}
                  {f.archived ? "Restore" : "Archive"}
                </button>
              </div>
            </div>
            {f.kind === "select" && (
              <ChoiceListInput value={f.options ?? []} onChange={(options) => change(i, { options })} />
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** One choice per line; kept as typed until it loses focus, so commas and new lines can be typed freely. */
function ChoiceListInput({ value, onChange }: { value: Option[]; onChange: (options: Option[]) => void }) {
  const [text, setText] = useState(value.map((o) => o.label).join("\n"));
  return (
    <label className="mt-3 flex flex-col gap-1 text-sm">
      <span className="font-medium text-foreground/80">Choices (one per line)</span>
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onChange(parseChoiceList(text, value))}
        className={inputClass}
        placeholder={"e.g.\nGround floor\nFirst floor"}
      />
    </label>
  );
}
