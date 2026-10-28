/**
 * Downloads one project list (materials, attendance, transport, …) as a PDF table, in the browser:
 * ids resolved to names, choices to their labels, amounts in rupees, with totals where they make sense.
 */
import { choiceLabel, getCollection, isFieldVisible, type CollectionName, type FieldDef } from "@/lib/collections";
import { formatDate } from "@/lib/format";
import { balanceDue } from "@/lib/ledger";
import type { LedgerRecord } from "@/lib/types";

const fetchRecords = async (projectId: string, collection: CollectionName): Promise<LedgerRecord[]> => {
  const response = await fetch(`/api/projects/${projectId}/records/${collection}`);
  if (!response.ok) throw new Error("load failed");
  return response.json();
};

export async function downloadCollectionPdf(projectId: string, projectName: string, collection: CollectionName, title: string) {
  const [{ downloadTablePdf, money }, records] = await Promise.all([import("@/lib/pdf"), fetchRecords(projectId, collection)]);
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
    if (field.kind === "money") return money(Number(value));
    if (field.kind === "number") return Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
    if (field.kind === "date") return formatDate(String(value));
    if (field.kind === "select" || field.kind === "radio") return choiceLabel(def, field, record);
    if (field.kind === "ref") return refNames.get(String(value)) ?? "(deleted)";
    return String(value);
  };

  // Detail fields (like "Material name" for Other) are shown inside the choice they describe.
  const fields = def.fields.filter((f) => !f.describes);
  // Bills that can be part paid also get the balance still owed.
  const hasBalance = def.fields.some((f) => f.name === "paidAmount");
  // Money columns carry "(Rs.)" in the heading, so the cells line up as plain amounts.
  const head = [...fields.map((f) => (f.kind === "money" ? `${f.label} (Rs.)` : f.label)), ...(hasBalance ? ["Balance due (Rs.)"] : [])];
  const sorted = def.dateField ? [...records].sort((a, b) => String(a[def.dateField!]).localeCompare(String(b[def.dateField!]))) : records;
  const rows = sorted.map((r) => {
    const balance = balanceDue(r);
    return [...fields.map((f) => show(f, r)), ...(hasBalance ? [balance > 0 ? money(balance) : "-"] : [])];
  });
  const rightColumns = [
    ...fields.flatMap((f, i) => (f.kind === "money" || f.kind === "number" ? [i] : [])),
    ...(hasBalance ? [fields.length] : []),
  ];

  // Totals for the total amount, the amount paid on part-paid bills, and the balance due.
  const sum = (pick: (r: LedgerRecord) => number) => money(records.reduce((s, r) => s + pick(r), 0));
  const totals: Record<number, string> = {};
  const amountIndex = fields.findIndex((f) => f.name === "amount" && !f.showIf);
  if (amountIndex >= 0) totals[amountIndex] = sum((r) => (typeof r.amount === "number" ? r.amount : 0));
  const paidIndex = fields.findIndex((f) => f.name === "paidAmount");
  if (paidIndex >= 0) totals[paidIndex] = sum((r) => (r.paymentStatus === "partial" ? Number(r.paidAmount) || 0 : 0));
  if (hasBalance) totals[fields.length] = sum((r) => balanceDue(r));

  await downloadTablePdf({
    projectName,
    title,
    head,
    rows,
    rightColumns,
    total: Object.keys(totals).length > 0 ? { label: "Total", values: totals } : undefined,
  });
}
