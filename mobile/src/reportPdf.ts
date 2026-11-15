import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { formatDate, formatNumber } from "@/lib/format";
import { PAYMENT_STATUS_LABEL, type PeriodReport } from "@/lib/period-report";

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

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4 landscape; margin: 14mm; }
    body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #1c1917; font-size: 10px; }
    .bar { height: 5px; background: #ea580c; margin-bottom: 10px; }
    h1 { font-size: 18px; margin: 0; } .sub { color: #666; margin: 4px 0 14px; }
    h2 { color: #c2410c; font-size: 13px; margin: 16px 0 6px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #ea580c; color: #fff; text-align: left; padding: 5px; }
    td { padding: 5px; border-bottom: 1px solid #eee; }
    tfoot td { background: #fff1e6; font-weight: bold; }
    .r { text-align: right; } .note { color: #777; }
  </style></head><body><div class="bar"></div>
  <h1>${esc(`${MODE_NAME[report.mode]} report - ${projectName}`)}</h1>
  <p class="sub">${esc(periodLabel)} · Generated ${esc(formatDate(new Date().toISOString()))} by BuildLedger</p>
  ${body}</body></html>`;

  const { uri } = await Print.printToFileAsync({ html, width: 842, height: 595 });
  await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Share report", UTI: "com.adobe.pdf" });
}
