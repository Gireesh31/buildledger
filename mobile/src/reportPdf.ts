import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { choiceLabel, getCollection, isFieldVisible, type CollectionName, type FieldDef } from "@/lib/collections";
import { formatDate, formatNumber } from "@/lib/format";
import { balanceDue } from "@/lib/ledger";
import { PAYMENT_STATUS_LABEL, type PeriodReport } from "@/lib/period-report";
import type { LedgerRecord } from "@/lib/types";
import { loadRecords } from "./data";

const MODE_NAME = { day: "Daily", week: "Weekly", month: "Monthly", total: "Day 1 to today", custom: "Custom dates" } as const;
/** Money column cells: the heading says "(₹)", so the cells are plain amounts that line up. */
const money = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const status = (s: string) => PAYMENT_STATUS_LABEL[s] ?? "-";

/** One table; `right` lists the numeric (right-aligned) columns. */
function table(title: string, head: string[], rows: string[][], right: number[], foot?: string[], empty = "Nothing in this period.") {
  const cell = (tag: "td" | "th", text: string, i: number) => `<${tag}${right.includes(i) ? ' class="r"' : ""}>${esc(text)}</${tag}>`;
  return `<h2>${esc(title)}</h2>${
    rows.length === 0
      ? `<p class="note">${esc(empty)}</p>`
      : `<table><thead><tr>${head.map((h, i) => cell("th", h, i)).join("")}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c, i) => cell("td", c, i)).join("")}</tr>`)
          .join("")}</tbody>${foot ? `<tfoot><tr>${foot.map((c, i) => cell("td", c, i)).join("")}</tr></tfoot>` : ""}</table>`
  }`;
}

/** The same report as the website's PDF (same sections and columns), shared from the phone. */
export async function sharePeriodReportPdf(report: PeriodReport, projectName: string, periodLabel: string) {
  const t = report.totals;
  const body = [
    table(
      "Summary",
      ["", "Amount (₹)"],
      [
        ["Material purchases", money(t.materials)],
        ["Labour (workers & teams)", money(t.labour)],
        ["Transport & machinery", money(t.transport)],
        ["Total spent", money(t.spent)],
        ["Still owed on material & transport bills", money(t.billsDue)],
        ["Paid out", money(t.paid)],
        [`Outstanding dues as of ${formatDate(report.duesAsOf)}`, money(t.due)],
      ],
      [1],
    ),
    table(
      "Material purchases",
      ["Date", "Material", "Unit", "Quantity", "Price per unit (₹)", "Payment mode", "Payment status", "Amount paid (₹)", "Total price (₹)", "Balance due (₹)"],
      report.materials.map((m) => [formatDate(m.date), m.material, m.unit, formatNumber(m.quantity), money(m.unitPrice), m.paymentMode || "-", status(m.status), m.paidAmount > 0 ? money(m.paidAmount) : "-", money(m.amount), m.balance > 0 ? money(m.balance) : "-"]),
      [3, 4, 7, 8, 9],
      ["Total", "", "", "", "", "", "", money(report.materials.reduce((s, m) => s + m.paidAmount, 0)), money(t.materials), money(report.materials.reduce((s, m) => s + m.balance, 0))],
    ),
    table(
      "Workers & teams",
      ["Date", "Type", "Name", "Trade", "Daily wage (₹)", "Team amount (₹)", "Amount paid (₹)", "Payment mode", "Payment status", "Due (₹)"],
      report.workers.map((w) => [
        formatDate(w.date),
        w.isTeam ? "Team" : "Worker",
        w.name,
        w.trade,
        w.isTeam ? "-" : money(w.dailyWage),
        w.isTeam ? money(w.amount) : "-",
        w.amountPaid > 0 ? money(w.amountPaid) : "-",
        w.paymentMode || "-",
        status(w.status),
        w.due > 0 ? money(w.due) : w.due < 0 ? `${money(-w.due)} advance` : "Paid",
      ]),
      [4, 5, 6, 9],
    ),
    table(
      "Labour cost (attendance & teams)",
      ["Date", "Worker / team", "Details", "Amount (₹)"],
      report.labour.map((l) => [formatDate(l.date), l.name, l.detail, money(l.amount)]),
      [3],
      ["Total", "", "", money(t.labour)],
    ),
    table(
      "Transport & machinery",
      ["Date", "Vehicle", "Name of the transport", "Charged", "Hours", "Rate per hour (₹)", "Payment mode", "Payment status", "Amount paid (₹)", "Total (₹)", "Balance due (₹)"],
      report.transport.map((v) => [
        formatDate(v.date),
        v.vehicle,
        v.transportName || "-",
        v.hours !== null ? "Per hour" : "Full amount",
        v.hours !== null ? formatNumber(v.hours) : "-",
        v.ratePerHour !== null ? money(v.ratePerHour) : "-",
        v.paymentMode || "-",
        status(v.status),
        v.paidAmount > 0 ? money(v.paidAmount) : "-",
        money(v.amount),
        v.balance > 0 ? money(v.balance) : "-",
      ]),
      [4, 5, 8, 9, 10],
      ["Total", "", "", "", "", "", "", "", money(report.transport.reduce((s, v) => s + v.paidAmount, 0)), money(t.transport), money(report.transport.reduce((s, v) => s + v.balance, 0))],
    ),
    table(
      `Outstanding dues as of ${formatDate(report.duesAsOf)}`,
      ["Worker / team", "Type", "Last worked", "Earned (₹)", "Paid (₹)", "Due (₹)"],
      report.dues.map((d) => [d.name, d.kind, d.lastWorked ? formatDate(d.lastWorked) : "-", money(d.earned), money(d.paid), money(d.due)]),
      [3, 4, 5],
      ["Total", "", "", "", "", money(t.due)],
      "Nothing owed. All workers and teams are settled.",
    ),
  ].join("");

  await printAndShare(`${MODE_NAME[report.mode]} report - ${projectName}`, `${periodLabel} · Generated ${formatDate(new Date().toISOString())} by BuildLedger`, body, "Share report");
}

/** An A4 landscape page in the website PDF's style, printed to a file and opened in the share sheet. */
async function printAndShare(title: string, sub: string, body: string, dialogTitle: string) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4 landscape; margin: 14mm; }
    body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #1c1917; font-size: 10px; }
    .bar { height: 5px; background: #1f5135; margin-bottom: 10px; }
    h1 { font-size: 18px; margin: 0; } .sub { color: #666; margin: 4px 0 14px; }
    h2 { color: #c2410c; font-size: 13px; margin: 16px 0 6px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1f5135; color: #fff; text-align: left; padding: 5px; }
    td { padding: 5px; border-bottom: 1px solid #eee; }
    tfoot td { background: #fff1e6; font-weight: bold; }
    .r { text-align: right; } .note { color: #777; }
  </style></head><body><div class="bar"></div>
  <h1>${esc(title)}</h1>
  <p class="sub">${esc(sub)}</p>
  ${body}</body></html>`;

  const { uri } = await Print.printToFileAsync({ html, width: 842, height: 595 });
  await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle, UTI: "com.adobe.pdf" });
}

/**
 * One project list (materials, workers, attendance, transport, daily log) as a PDF table, like the
 * website's "Download lists as PDF": names for linked entries, choice labels, rupee columns and totals.
 * `period`: only entries dated from `from` to `to`.
 */
export async function shareCollectionPdf(projectId: string, projectName: string, collection: CollectionName, title: string, period?: { from: string; to: string; label: string }) {
  const def = getCollection(collection);
  const all = await loadRecords(projectId, collection);
  const dateOf = (r: LedgerRecord) => String(r[def.dateField ?? ""] ?? r.createdAt.slice(0, 10));
  const records = period ? all.filter((r) => dateOf(r) >= period.from && dateOf(r) <= period.to) : all;

  const refNames = new Map<string, string>();
  for (const ref of new Set(def.fields.flatMap((f) => (f.ref ? [f.ref] : [])))) {
    const titleField = getCollection(ref).titleField;
    for (const r of await loadRecords(projectId, ref)) refNames.set(r.id, String(r[titleField] ?? ""));
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

  const fields = def.fields.filter((f) => !f.describes);
  const hasBalance = def.fields.some((f) => f.name === "paidAmount");
  const head = [...fields.map((f) => (f.kind === "money" ? `${f.label} (₹)` : f.label)), ...(hasBalance ? ["Balance due (₹)"] : [])];
  const sorted = def.dateField ? [...records].sort((a, b) => String(a[def.dateField!]).localeCompare(String(b[def.dateField!]))) : records;
  const rows = sorted.map((r) => {
    const balance = balanceDue(r);
    return [...fields.map((f) => show(f, r)), ...(hasBalance ? [balance > 0 ? money(balance) : "-"] : [])];
  });
  const right = [...fields.flatMap((f, i) => (f.kind === "money" || f.kind === "number" ? [i] : [])), ...(hasBalance ? [fields.length] : [])];

  const sum = (pick: (r: LedgerRecord) => number) => money(records.reduce((s, r) => s + pick(r), 0));
  const foot: string[] = head.map(() => "");
  foot[0] = "Total";
  const amountIndex = fields.findIndex((f) => f.name === "amount" && !f.showIf);
  if (amountIndex >= 0) foot[amountIndex] = sum((r) => (typeof r.amount === "number" ? r.amount : 0));
  const paidIndex = fields.findIndex((f) => f.name === "paidAmount");
  if (paidIndex >= 0) foot[paidIndex] = sum((r) => (r.paymentStatus === "partial" ? Number(r.paidAmount) || 0 : 0));
  if (hasBalance) foot[fields.length] = sum((r) => balanceDue(r));
  const hasTotals = amountIndex >= 0 || paidIndex >= 0 || hasBalance;

  const sub = `${period ? `${period.label} · ` : ""}${records.length} ${records.length === 1 ? "entry" : "entries"} · Generated ${formatDate(new Date().toISOString())} by BuildLedger`;
  await printAndShare(`${title} - ${projectName}`, sub, table(title, head, rows, right, hasTotals && rows.length > 0 ? foot : undefined, "No entries in this period."), `Share ${title}`);
}
