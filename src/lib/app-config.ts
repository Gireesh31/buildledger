/**
 * App-wide settings that admins change in the admin panel: form choices and extra fields, and which
 * sections are switched on. The server loads them from the database; the website and the mobile app
 * get the same object (from the page or GET /api/config) and apply it, so a change shows up everywhere.
 */
import {
  customFieldCollections,
  editableChoiceFields,
  getBaseCollection,
  setFormConfig,
  type CollectionName,
  type CustomField,
  type CustomFieldKind,
  type FormConfig,
  type Option,
} from "@/lib/collections";

export type FeatureKey = "labour" | "transport" | "dailyLog" | "files" | "reports" | "team";

export const featureList: { key: FeatureKey; label: string; description: string }[] = [
  { key: "labour", label: "Labour", description: "Workers, teams, attendance and wages." },
  { key: "transport", label: "Transport", description: "Vehicles and machinery hire." },
  { key: "dailyLog", label: "Daily log", description: "Daily site diary: work done, weather, issues." },
  { key: "files", label: "Bills & photos", description: "Uploading bills, site photos and documents." },
  { key: "reports", label: "Reports", description: "Period reports and PDF exports." },
  { key: "team", label: "Team", description: "Inviting people to a project." },
];

export type Features = Record<FeatureKey, boolean>;

export interface AppConfig {
  forms: FormConfig;
  features: Features;
}

export const defaultFeatures: Features = { labour: true, transport: true, dailyLog: true, files: true, reports: true, team: true };

export const defaultAppConfig: AppConfig = { forms: {}, features: defaultFeatures };

let current: AppConfig = defaultAppConfig;

/** Installs the settings in this runtime (server request, browser or app). Safe to call on every render. */
export function applyAppConfig(config: AppConfig | undefined) {
  current = config ?? defaultAppConfig;
  setFormConfig(current.forms);
}

export const isFeatureOn = (key: FeatureKey) => current.features[key] !== false;

export const currentAppConfig = () => current;

/** Which feature a project ledger belongs to (materials are always on). */
export function featureForCollection(collection: CollectionName): FeatureKey | undefined {
  if (collection === "workers" || collection === "attendance") return "labour";
  if (collection === "transport") return "transport";
  if (collection === "dailyLogs") return "dailyLog";
  return undefined;
}

// --- Checking what the admin panel sends -------------------------------------------------------

const label = (value: unknown, max = 60) => (typeof value === "string" && value.trim() && value.trim().length <= max ? value.trim() : null);

/** A stored value made from a label, e.g. "Fly ash bricks" → "fly-ash-bricks". */
export const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

function parseOptions(value: unknown, max = 50): Option[] | null {
  if (!Array.isArray(value) || value.length > max) return null;
  const out: Option[] = [];
  for (const item of value) {
    const l = label(item?.label);
    const v = typeof item?.value === "string" && /^[a-z0-9-]{1,40}$/.test(item.value) ? item.value : l && slug(l);
    if (!l || !v || out.some((o) => o.value === v)) return null;
    out.push({ value: v, label: l });
  }
  return out;
}

const customKinds: CustomFieldKind[] = ["text", "textarea", "number", "money", "date", "select"];

/** Validates the forms settings; returns an error message or the cleaned config. */
export function parseFormConfig(input: unknown): { ok: true; forms: FormConfig } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Invalid form settings." };
  const forms: FormConfig = {};
  for (const [name, raw] of Object.entries(input as Record<string, unknown>)) {
    const collection = name as CollectionName;
    const base = Object.hasOwn({ materials: 1, workers: 1, transport: 1, dailyLogs: 1, attendance: 1 }, name) ? getBaseCollection(collection) : null;
    if (!base || !raw || typeof raw !== "object") return { ok: false, error: `Unknown form “${name}”.` };
    const entry: NonNullable<FormConfig[CollectionName]> = {};
    const { choices, customFields } = raw as { choices?: unknown; customFields?: unknown };

    if (choices !== undefined) {
      if (!choices || typeof choices !== "object") return { ok: false, error: "Invalid choices." };
      entry.choices = {};
      for (const [field, override] of Object.entries(choices as Record<string, unknown>)) {
        const editable = editableChoiceFields.find((e) => e.collection === collection && e.field === field);
        const builtIn = base.fields.find((f) => f.name === field)?.options ?? [];
        if (!editable || !override || typeof override !== "object") return { ok: false, error: `Choices for “${field}” can't be edited.` };
        const o = override as { labels?: unknown; hidden?: unknown; added?: unknown };
        const labels: Record<string, string> = {};
        for (const [value, text] of Object.entries((o.labels ?? {}) as Record<string, unknown>)) {
          const l = label(text);
          if (!l || !builtIn.some((b) => b.value === value)) return { ok: false, error: "Every choice needs a name (up to 60 characters)." };
          if (l !== builtIn.find((b) => b.value === value)!.label) labels[value] = l;
        }
        const added = parseOptions(o.added ?? []);
        if (!added) return { ok: false, error: "Every new choice needs a different name (up to 60 characters)." };
        if (added.some((a) => builtIn.some((b) => b.value === a.value))) return { ok: false, error: "A new choice has the same name as a built-in one." };
        const known = [...builtIn.map((b) => b.value), ...added.map((a) => a.value)];
        const hidden = Array.isArray(o.hidden) ? o.hidden.filter((v): v is string => typeof v === "string" && known.includes(v)) : [];
        if (hidden.some((v) => editable.locked.includes(v))) return { ok: false, error: "“Other” can be renamed but not hidden." };
        if (hidden.length >= known.length) return { ok: false, error: "Keep at least one choice." };
        entry.choices[field] = { ...(Object.keys(labels).length && { labels }), ...(hidden.length && { hidden }), ...(added.length && { added }) };
      }
    }

    if (customFields !== undefined) {
      if (!customFieldCollections.includes(collection) || !Array.isArray(customFields) || customFields.length > 20) {
        return { ok: false, error: "Invalid extra fields." };
      }
      entry.customFields = [];
      for (const f of customFields as Record<string, unknown>[]) {
        const l = label(f?.label);
        const kind = customKinds.find((k) => k === f?.kind);
        if (!l || !kind) return { ok: false, error: "Every extra field needs a name (up to 60 characters) and a type." };
        const name = typeof f.name === "string" && /^custom_[a-z0-9_]{1,40}$/.test(f.name) ? f.name : `custom_${slug(l).replace(/-/g, "_")}`;
        if (name === "custom_" || entry.customFields.some((c) => c.name === name)) return { ok: false, error: `Two extra fields are both called “${l}”.` };
        const field: CustomField = { name, label: l, kind, ...(f.required === true && { required: true }), ...(f.archived === true && { archived: true }) };
        if (kind === "select") {
          const options = parseOptions(f.options, 30);
          if (!options || options.length === 0) return { ok: false, error: `Add at least one choice to “${l}”.` };
          field.options = options;
        }
        entry.customFields.push(field);
      }
    }
    forms[collection] = entry;
  }
  return { ok: true, forms };
}

export function parseFeatures(input: unknown): Features | null {
  if (!input || typeof input !== "object") return null;
  const out = { ...defaultFeatures };
  for (const { key } of featureList) {
    const value = (input as Record<string, unknown>)[key];
    if (value !== undefined && typeof value !== "boolean") return null;
    if (typeof value === "boolean") out[key] = value;
  }
  return out;
}

// --- Announcements -----------------------------------------------------------------------------

export type AnnouncementKind = "news" | "feature" | "offer";

export const announcementKinds: { value: AnnouncementKind; label: string }[] = [
  { value: "news", label: "Announcement" },
  { value: "feature", label: "New feature" },
  { value: "offer", label: "Offer" },
];

export interface Announcement {
  id: string;
  kind: AnnouncementKind;
  title: string;
  body: string;
  linkUrl?: string;
  linkLabel?: string;
  startsAt?: string;
  endsAt?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}
