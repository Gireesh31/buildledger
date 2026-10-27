/**
 * Downloads one project list (materials, attendance, transport, …) as a PDF table, in the browser:
 * ids resolved to names, choices to their labels, amounts in rupees, with a total where there is one.
 */
import { choiceLabel, getCollection, isFieldVisible, type CollectionName, type FieldDef } from "@/lib/collections";
import { formatDate } from "@/lib/format";
import type { LedgerRecord } from "@/lib/types";

const fetchRecords = async (projectId: string, collection: CollectionName): Promise<LedgerRecord[]> => {
  const response = await fetch(`/api/projects/${projectId}/records/${collection}`);
  if (!response.ok) throw new Error("load failed");
  return response.json();
};

export async function downloadCollectionPdf(projectId: string, projectName: string, collection: CollectionName, title: string) {
  const [{ downloadTablePdf, rs }, records] = await Promise.all([import("@/lib/pdf"), fetchRecords(projectId, collection)]);
  const def = getCollection(collection);

  // Names for referenced records (e.g. workers in attendance).
  const refNames = new Map<string, string>();
  for (const ref of new Set(def.fields.flatMap((f) => (f.ref ? [f.ref] : [])))) {
    const titleField = getCollection(ref).titleField;
    for (const r of await fetchRecords(projectId, ref)) refNames.set(r.id, String(r[titleField] ?? ""));
  }

  const show = (field: FieldDef, record: LedgerRecord): string => {
    const value = record[field.name];
    if (value === undefined || value === "" || !isFieldVisible(field, record)) return "-";
    if (field.kind === "money") return rs(Number(value));
    if (field.kind === "number") return Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
    if (field.kind === "date") return formatDate(String(value));
    if (field.kind === "select" || field.kind === "radio") return choiceLabel(def, field, record);
    if (field.kind === "ref") return refNames.get(String(value)) ?? "(deleted)";
    return String(value);
  };

  // Detail fields (like "Material name" for Other) are shown inside the choice they describe.
  const fields = def.fields.filter((f) => !f.describes);
  const head = fields.map((f) => f.label);
  const sorted = def.dateField ? [...records].sort((a, b) => String(a[def.dateField!]).localeCompare(String(b[def.dateField!]))) : records;
  const rows = sorted.map((r) => fields.map((f) => show(f, r)));
  const rightColumns = fields.flatMap((f, i) => (f.kind === "money" || f.kind === "number" ? [i] : []));
  const amountIndex = fields.findIndex((f) => f.name === "amount" && !f.showIf);
  const total =
    amountIndex >= 0 ? { label: "Total", column: amountIndex, value: rs(records.reduce((s, r) => s + (typeof r.amount === "number" ? r.amount : 0), 0)) } : undefined;

  await downloadTablePdf({ projectName, title, head, rows, rightColumns, total });
}
