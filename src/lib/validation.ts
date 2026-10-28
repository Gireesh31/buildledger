import { computeField, getCollection, isFieldVisible, type CollectionName, type FieldDef } from "@/lib/collections";
import type { InviteRole, Project, ProjectStatus, ProjectType } from "@/lib/types";

export function parseName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name.length > 0 && name.length <= 100 ? name : null;
}

export function parseDescription(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const description = value.trim();
  return description.length <= 500 ? description : null;
}

export const PASSWORD_MIN_LENGTH = 8;

export function parseEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function parsePassword(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.length >= PASSWORD_MIN_LENGTH && value.length <= 200 ? value : null;
}

export function parseInviteRole(value: unknown): InviteRole | null {
  return value === "editor" || value === "viewer" ? value : null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string) {
  return DATE_RE.test(value) && !Number.isNaN(Date.parse(value));
}

function parseAmount(value: unknown): number | null {
  const num = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/[,₹\s]/g, "")) : NaN;
  return Number.isFinite(num) && num >= 0 && num < 1e12 ? Math.round(num * 100) / 100 : null;
}

export const projectStatuses: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "In progress" },
  { value: "on-hold", label: "On hold" },
  { value: "completed", label: "Completed" },
];

export const projectTypes: { value: ProjectType; label: string }[] = [
  { value: "residential", label: "Residential house" },
  { value: "commercial", label: "Commercial building" },
  { value: "renovation", label: "Renovation" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "other", label: "Other" },
];

export type ProjectFields = Partial<Omit<Project, "id" | "ownerId" | "createdAt" | "updatedAt">>;

/**
 * Parses the editable project fields present in `body`. With `requireName`, the name must be present.
 * Empty strings clear optional fields.
 */
export function parseProjectFields(
  body: Record<string, unknown>,
  { requireName }: { requireName: boolean },
): { ok: true; fields: ProjectFields } | { ok: false; error: string } {
  const fields: ProjectFields = {};
  const has = (key: string) => key in body && body[key] !== undefined;
  const isEmpty = (key: string) => body[key] === "" || body[key] === null;

  if (requireName || has("name")) {
    const name = parseName(body.name);
    if (!name) return { ok: false, error: "Project name is required (1-100 characters)." };
    fields.name = name;
  }
  if (has("description")) {
    const description = parseDescription(body.description);
    if (description === null) return { ok: false, error: "Description must be 500 characters or fewer." };
    fields.description = description;
  }
  if (has("location")) {
    const location = typeof body.location === "string" ? body.location.trim() : "";
    if (location.length > 200) return { ok: false, error: "Location must be 200 characters or fewer." };
    fields.location = location;
  }
  if (has("projectType") && !isEmpty("projectType")) {
    const type = projectTypes.find((t) => t.value === body.projectType);
    if (!type) return { ok: false, error: "Invalid project type." };
    fields.projectType = type.value;
  }
  if (has("status")) {
    const status = projectStatuses.find((s) => s.value === body.status);
    if (!status) return { ok: false, error: "Invalid status." };
    fields.status = status.value;
  }
  for (const key of ["budget", "areaSqft"] as const) {
    if (!has(key)) continue;
    if (isEmpty(key)) {
      fields[key] = undefined;
      continue;
    }
    const value = parseAmount(body[key]);
    if (value === null) return { ok: false, error: `${key === "budget" ? "Budget" : "Area"} must be a positive number.` };
    fields[key] = value;
  }
  for (const key of ["startDate", "endDate"] as const) {
    if (!has(key)) continue;
    if (isEmpty(key)) {
      fields[key] = undefined;
      continue;
    }
    const value = body[key];
    if (typeof value !== "string" || !isValidDate(value)) return { ok: false, error: "Invalid date." };
    fields[key] = value;
  }
  if (fields.startDate && fields.endDate && fields.endDate < fields.startDate) {
    return { ok: false, error: "End date must be after the start date." };
  }
  return { ok: true, fields };
}

type RecordValues = Record<string, string | number>;

/**
 * Validates a ledger record against its collection definition. `refExists` checks that
 * referenced ids (e.g. a worker) belong to the same project.
 */
export async function parseRecord(
  collection: CollectionName,
  body: unknown,
  refExists: (collection: CollectionName, id: string) => Promise<boolean>,
): Promise<{ ok: true; values: RecordValues } | { ok: false; error: string }> {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Invalid JSON body." };
  const input = body as Record<string, unknown>;
  const values: RecordValues = {};

  const fields = getCollection(collection).fields;
  for (const field of fields) {
    if (field.computed || !isFieldVisible(field, input)) continue;
    const raw = input[field.name];
    const empty = raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "");
    if (empty) {
      if (field.required) return { ok: false, error: `${field.label} is required.` };
      continue;
    }
    const result = await parseFieldValue(field, raw, refExists);
    if (result === null) return { ok: false, error: `Invalid ${field.label.toLowerCase()}.` };
    values[field.name] = result;
  }

  // Calculated fields are never taken from the client.
  for (const field of fields) {
    if (!field.computed) continue;
    values[field.name] = computeField(getCollection(collection), field, values);
  }

  // Part paid: something was paid, but less than the total (the rest is the balance due).
  if (values.paymentStatus === "partial" && typeof values.amount === "number") {
    const paid = Number(values.paidAmount) || 0;
    if (paid <= 0) return { ok: false, error: "Enter the amount paid." };
    if (paid >= values.amount) return { ok: false, error: "Amount paid must be less than the total. Choose “Paid” if it's fully paid." };
  }
  return { ok: true, values };
}

async function parseFieldValue(
  field: FieldDef,
  raw: unknown,
  refExists: (collection: CollectionName, id: string) => Promise<boolean>,
): Promise<string | number | null> {
  switch (field.kind) {
    case "number":
    case "money":
      return parseAmount(raw);
    case "date":
      return typeof raw === "string" && isValidDate(raw) ? raw : null;
    case "select":
    case "radio":
      return typeof raw === "string" && field.options?.some((o) => o.value === raw) ? raw : null;
    case "ref":
      return typeof raw === "string" && field.ref && (await refExists(field.ref, raw)) ? raw : null;
    case "phone":
      return typeof raw === "string" && /^[+\d][\d\s-]{5,19}$/.test(raw.trim()) ? raw.trim() : null;
    case "textarea":
      return typeof raw === "string" && raw.length <= 2000 ? raw.trim() : null;
    default:
      return typeof raw === "string" && raw.length <= 200 ? raw.trim() : null;
  }
}
