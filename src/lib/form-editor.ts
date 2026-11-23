/**
 * Editing helpers for the admin panel's form settings, shared by the website and the mobile app so
 * both edit the same way. Pure functions: they take the current settings and return new ones.
 */
import { slug } from "@/lib/app-config";
import {
  customFieldCollections,
  editableChoiceFields,
  getBaseCollection,
  type CollectionName,
  type CustomField,
  type CustomFieldKind,
  type FormConfig,
  type Option,
} from "@/lib/collections";

export interface ChoiceRow {
  value: string;
  label: string;
  /** Part of the app; can be renamed or hidden, not removed. */
  builtIn: boolean;
  /** Can be renamed only (e.g. "Other", which opens its own name box). */
  locked: boolean;
  hidden: boolean;
}

export const editableForms: CollectionName[] = ["materials", "workers", "transport", "dailyLogs"];

export const formLabel = (collection: CollectionName) => getBaseCollection(collection).label;

export const fieldLabel = (collection: CollectionName, field: string) =>
  getBaseCollection(collection).fields.find((f) => f.name === field)?.label ?? field;

export const choiceFieldsOf = (collection: CollectionName) => editableChoiceFields.filter((e) => e.collection === collection);

export const takesCustomFields = (collection: CollectionName) => customFieldCollections.includes(collection);

export const customKinds: { value: CustomFieldKind; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "money", label: "Amount (₹)" },
  { value: "date", label: "Date" },
  { value: "select", label: "Choice list" },
];

/** The choices of one field as editable rows: built-in ones first (in order), then added ones. */
export function choiceRows(forms: FormConfig, collection: CollectionName, field: string): ChoiceRow[] {
  const editable = editableChoiceFields.find((e) => e.collection === collection && e.field === field);
  const base = getBaseCollection(collection).fields.find((f) => f.name === field)?.options ?? [];
  const override = forms[collection]?.choices?.[field] ?? {};
  const hidden = new Set(override.hidden ?? []);
  return [
    ...base.map((o) => ({
      value: o.value,
      label: override.labels?.[o.value] ?? o.label,
      builtIn: true,
      locked: editable?.locked.includes(o.value) ?? false,
      hidden: hidden.has(o.value),
    })),
    ...(override.added ?? []).map((o) => ({ value: o.value, label: o.label, builtIn: false, locked: false, hidden: hidden.has(o.value) })),
  ];
}

/** Stores edited rows back into the settings. */
export function withChoiceRows(forms: FormConfig, collection: CollectionName, field: string, rows: ChoiceRow[]): FormConfig {
  const base = getBaseCollection(collection).fields.find((f) => f.name === field)?.options ?? [];
  const labels: Record<string, string> = {};
  for (const row of rows) {
    const builtIn = base.find((b) => b.value === row.value);
    if (builtIn && row.label !== builtIn.label) labels[row.value] = row.label;
  }
  const entry = forms[collection] ?? {};
  return {
    ...forms,
    [collection]: {
      ...entry,
      choices: {
        ...entry.choices,
        [field]: {
          labels,
          hidden: rows.filter((r) => r.hidden && !r.locked).map((r) => r.value),
          added: rows.filter((r) => !r.builtIn).map((r) => ({ value: r.value, label: r.label })),
        },
      },
    },
  };
}

/** A value for a new choice that no other choice of the field uses. */
export function newChoiceValue(rows: { value: string }[], label: string): string {
  const root = slug(label) || "choice";
  let value = root;
  for (let i = 2; rows.some((r) => r.value === value); i++) value = `${root}-${i}`.slice(0, 40);
  return value;
}

export const customFieldsOf = (forms: FormConfig, collection: CollectionName): CustomField[] => forms[collection]?.customFields ?? [];

export function withCustomFields(forms: FormConfig, collection: CollectionName, fields: CustomField[]): FormConfig {
  return { ...forms, [collection]: { ...forms[collection], customFields: fields } };
}

/** A stored key for a new extra field that doesn't clash with any other field of the form. */
export function newCustomFieldName(collection: CollectionName, existing: CustomField[], label: string): string {
  const root = `custom_${(slug(label) || "field").replace(/-/g, "_")}`.slice(0, 47);
  const taken = (name: string) => existing.some((f) => f.name === name) || getBaseCollection(collection).fields.some((f) => f.name === name);
  let name = root;
  for (let i = 2; taken(name); i++) name = `${root}_${i}`;
  return name;
}

/** Choices for an extra choice-list field, typed one per line (or comma-separated); existing ones keep their stored value. */
export function parseChoiceList(text: string, previous: Option[] = []): Option[] {
  const out: Option[] = [];
  for (const label of text.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)) {
    const kept = previous.find((p) => p.label === label);
    const value = kept?.value ?? newChoiceValue(out, label);
    if (!out.some((o) => o.value === value)) out.push({ value, label });
  }
  return out;
}
