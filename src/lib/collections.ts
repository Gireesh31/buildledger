/**
 * Definitions for every project ledger. One definition drives the form, the table,
 * server-side validation and PDF export, so adding a field only happens here.
 */

/** "radio" is a select shown as a row of choice buttons. */
export type FieldKind = "text" | "textarea" | "number" | "money" | "date" | "select" | "radio" | "ref" | "phone";

export interface Option {
  value: string;
  label: string;
}

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: readonly Option[];
  /** For kind "ref": the collection the id points to. */
  ref?: CollectionName;
  placeholder?: string;
  /** Only shown (and stored) when another field has one of these values. */
  showIf?: { field: string; in: readonly string[] };
  /** Hide from the table to keep it readable; still in the form and PDF export. */
  hideInTable?: boolean;
  /** Titled panel the field appears in on the form (fields without one go in "Details"). */
  group?: string;
  /** Value a new entry starts with (otherwise required choices start on their first option). */
  defaultValue?: string;
  /** Extra detail for a choice, shown with it in lists and reports, e.g. "Other: Waterproofing chemical". */
  describes?: string;
  /**
   * Calculated, not entered: the product of two other fields (e.g. quantity × unit price), or, when either
   * of those isn't shown, the value of `fallback` (e.g. a full amount). Computed again on the server.
   */
  computed?: { product: readonly [string, string]; fallback?: string };
}

export interface CollectionDef {
  name: CollectionName;
  label: string;
  singular: string;
  fields: readonly FieldDef[];
  /** Field used when another record refers to this one. */
  titleField: string;
  /** Default sort: newest first by this date field, otherwise by title. */
  dateField?: string;
}

const opts = (...values: [string, string][]): Option[] => values.map(([value, label]) => ({ value, label }));

export const materialCategories = opts(
  ["cement", "Cement"],
  ["steel", "Steel / TMT"],
  ["sand", "Sand"],
  ["aggregate", "Aggregate / jelly"],
  ["bricks", "Bricks / blocks"],
  ["wood", "Wood / plywood"],
  ["electrical", "Electrical"],
  ["plumbing", "Plumbing"],
  ["paint", "Paint"],
  ["tiles", "Tiles / granite"],
  ["other", "Other"],
);

export const materialUnits = opts(
  ["bag", "Bag"],
  ["kg", "Kg"],
  ["ton", "Ton"],
  ["cft", "Cu ft"],
  ["brass", "Brass"],
  ["nos", "Nos"],
  ["sqft", "Sq ft"],
  ["rft", "Running ft"],
  ["litre", "Litre"],
  ["load", "Load"],
);

export const trades = opts(
  ["mason", "Mason"],
  ["helper", "Helper"],
  ["carpenter", "Carpenter"],
  ["bar-bender", "Bar bender"],
  ["electrician", "Electrician"],
  ["plumber", "Plumber"],
  ["painter", "Painter"],
  ["tile-worker", "Tile worker"],
  ["welder", "Welder"],
  ["supervisor", "Supervisor"],
  ["other", "Other"],
);

export const workerTypes = opts(["worker", "Worker"], ["team", "Team"]);

/** Older worker records have no type; they're individual workers. */
export const isTeam = (record: Record<string, unknown>) => record.workerType === "team";

export const paymentStatuses = opts(["advance", "Paid in advance"], ["paid", "Paid"], ["due", "Due"]);

/** Material and transport bills can also be part paid: some money given now, the rest still due. */
export const billPaymentStatuses = opts(["advance", "Paid in advance"], ["paid", "Paid"], ["partial", "Part paid"], ["due", "Due"]);

export const paymentModes = opts(["upi", "UPI"], ["cash", "Cash"], ["netbanking", "Net banking"], ["cheque", "Cheque"]);

/** How the money was given: same choice on the material, labour and transport forms. */
const paymentModeField = { name: "paymentMode", label: "Payment mode", kind: "radio", required: true, options: paymentModes, group: "Payment" } as const;

/** Same status field on the material, labour and transport forms. */
const paymentStatusField = {
  name: "paymentStatus",
  label: "Payment status",
  kind: "radio",
  required: true,
  options: paymentStatuses,
  defaultValue: "paid",
  group: "Payment",
} as const;

/** Payment status on bills, with "Part paid" and the amount paid so far. */
const billPaymentStatusField = { ...paymentStatusField, options: billPaymentStatuses } as const;
const paidAmountField = {
  name: "paidAmount",
  label: "Amount paid",
  kind: "money",
  required: true,
  showIf: { field: "paymentStatus", in: ["partial"] },
  group: "Payment",
} as const;

export const vehicleTypes = opts(
  ["jcb", "JCB"],
  ["hitachi", "Hitachi / excavator"],
  ["crane", "Crane"],
  ["truck", "Truck / tipper"],
  ["tractor", "Tractor"],
  ["mixer", "Concrete mixer"],
  ["roller", "Road roller"],
  ["tanker", "Water tanker"],
  ["other", "Other"],
);

export const chargeTypes = opts(["hourly", "Per hour"], ["full", "Full amount"]);

export const collections = {
  transport: {
    name: "transport",
    label: "Transport",
    singular: "Vehicle",
    titleField: "vehicle",
    dateField: "date",
    fields: [
      { name: "date", label: "Date", kind: "date", required: true },
      { name: "vehicle", label: "Vehicle", kind: "select", required: true, options: vehicleTypes },
      {
        name: "otherVehicle",
        label: "Vehicle name",
        kind: "text",
        required: true,
        placeholder: "e.g. Boom pump",
        showIf: { field: "vehicle", in: ["other"] },
        hideInTable: true,
        describes: "vehicle",
      },
      { name: "transportName", label: "Name of the transport", kind: "text", placeholder: "Owner or company, e.g. Sri Ganesh Earthmovers" },
      { name: "chargeType", label: "Charged", kind: "radio", required: true, options: chargeTypes, group: "Charges" },
      { name: "hours", label: "Hours", kind: "number", required: true, showIf: { field: "chargeType", in: ["hourly"] }, group: "Charges" },
      { name: "ratePerHour", label: "Rate per hour", kind: "money", required: true, showIf: { field: "chargeType", in: ["hourly"] }, group: "Charges" },
      { name: "fullAmount", label: "Full amount", kind: "money", required: true, showIf: { field: "chargeType", in: ["full"] }, hideInTable: true, group: "Charges" },
      paymentModeField,
      billPaymentStatusField,
      paidAmountField,
      { name: "amount", label: "Total", kind: "money", computed: { product: ["hours", "ratePerHour"], fallback: "fullAmount" } },
    ],
  },
  materials: {
    name: "materials",
    label: "Materials",
    singular: "Material",
    titleField: "category",
    dateField: "date",
    fields: [
      { name: "date", label: "Date", kind: "date", required: true },
      { name: "category", label: "Material", kind: "select", required: true, options: materialCategories },
      {
        name: "otherName",
        label: "Material name",
        kind: "text",
        required: true,
        placeholder: "e.g. Waterproofing chemical",
        showIf: { field: "category", in: ["other"] },
        hideInTable: true,
        describes: "category",
      },
      { name: "unit", label: "Unit", kind: "select", required: true, options: materialUnits },
      { name: "quantity", label: "Quantity", kind: "number", required: true },
      { name: "unitPrice", label: "Price per unit", kind: "money", required: true },
      paymentModeField,
      billPaymentStatusField,
      paidAmountField,
      { name: "amount", label: "Total price", kind: "money", computed: { product: ["quantity", "unitPrice"] } },
    ],
  },
  workers: {
    name: "workers",
    label: "Workers & teams",
    singular: "Worker or team",
    titleField: "name",
    dateField: "date",
    fields: [
      { name: "date", label: "Date", kind: "date", required: true },
      { name: "workerType", label: "Type", kind: "select", required: true, options: workerTypes },
      { name: "name", label: "Name", kind: "text", required: true, placeholder: "e.g. Ramesh, or Ramesh mason team" },
      { name: "trade", label: "Trade", kind: "select", required: true, options: trades },
      // Workers are paid per day of attendance; teams for a fixed amount.
      { name: "dailyWage", label: "Daily wage", kind: "money", required: true, showIf: { field: "workerType", in: ["worker"] }, group: "Wages & payment" },
      { name: "amount", label: "Team amount", kind: "money", required: true, showIf: { field: "workerType", in: ["team"] }, group: "Wages & payment" },
      // What's already been paid to this worker or team.
      { name: "amountPaid", label: "Amount paid", kind: "money", group: "Wages & payment" },
      { ...paymentModeField, group: "Wages & payment" },
      { ...paymentStatusField, group: "Wages & payment" },
    ],
  },
  attendance: {
    name: "attendance",
    label: "Attendance",
    singular: "Attendance",
    titleField: "date",
    dateField: "date",
    fields: [
      { name: "date", label: "Date", kind: "date", required: true },
      { name: "workerId", label: "Worker", kind: "ref", ref: "workers", required: true },
      {
        name: "status",
        label: "Status",
        kind: "select",
        required: true,
        options: opts(["present", "Present"], ["half", "Half day"], ["absent", "Absent"]),
      },
    ],
  },
  dailyLogs: {
    name: "dailyLogs",
    label: "Daily log",
    singular: "Daily log entry",
    titleField: "workDone",
    dateField: "date",
    fields: [
      { name: "date", label: "Date", kind: "date", required: true },
      {
        name: "weather",
        label: "Weather",
        kind: "select",
        options: opts(["sunny", "Sunny"], ["cloudy", "Cloudy"], ["rainy", "Rainy"], ["hot", "Very hot"]),
      },
      { name: "workDone", label: "Work done", kind: "textarea", required: true, placeholder: "e.g. First floor slab shuttering completed" },
      { name: "issues", label: "Issues / delays", kind: "textarea" },
      { name: "visitors", label: "Visitors", kind: "text", hideInTable: true },
    ],
  },
} as const;

export type CollectionName = keyof typeof collections;

export function isCollectionName(value: unknown): value is CollectionName {
  return typeof value === "string" && Object.hasOwn(collections, value);
}

export function getCollection(name: CollectionName): CollectionDef {
  return collections[name] as unknown as CollectionDef;
}

export function optionLabel(field: FieldDef, value: unknown): string {
  return field.options?.find((option) => option.value === value)?.label ?? String(value ?? "");
}

export function isFieldVisible(field: FieldDef, values: Record<string, unknown>): boolean {
  return !field.showIf || field.showIf.in.includes(String(values[field.showIf.field] ?? ""));
}

/** A choice's label plus any detail field that describes it, e.g. "Other: Waterproofing chemical". */
export function choiceLabel(def: CollectionDef, field: FieldDef, record: Record<string, unknown>): string {
  const label = optionLabel(field, record[field.name]);
  const detail = def.fields.find((f) => f.describes === field.name && isFieldVisible(f, record) && record[f.name]);
  return detail ? `${label}: ${String(record[detail.name])}` : label;
}

/** Value of a calculated field from the visible inputs: product (hours × rate) or the fallback (full amount). */
export function computeField(def: CollectionDef, field: FieldDef, values: Record<string, unknown>): number {
  if (!field.computed) return 0;
  const shown = (name: string) => {
    const f = def.fields.find((x) => x.name === name);
    return f ? isFieldVisible(f, values) : true;
  };
  const [a, b] = field.computed.product;
  const value =
    shown(a) && shown(b)
      ? (Number(values[a]) || 0) * (Number(values[b]) || 0)
      : field.computed.fallback && shown(field.computed.fallback)
        ? Number(values[field.computed.fallback]) || 0
        : 0;
  return Math.round(value * 100) / 100;
}
