/**
 * PDF documents built in the browser with jsPDF: the period report and plain table exports.
 * jsPDF's built-in fonts have no ₹ glyph, so money columns say "(Rs.)" in the heading and the
 * cells hold plain amounts with two decimals, which keeps the digits lined up.
 */
import { formatDate } from "@/lib/format";
import { PAYMENT_STATUS_LABEL, type PeriodReport } from "@/lib/period-report";

const status = (value: string) => PAYMENT_STATUS_LABEL[value] ?? "-";

/** An amount for a money column (its heading says "(Rs.)"): Indian grouping, always two decimals. */
export const money = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** An amount inside running text, where there's no column heading to carry the unit. */
export const rs = (n: number) => `Rs. ${money(n)}`;
const num = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "project";

type Cell = string | number;

/** A4 document with a title block, section headings, tables and page numbers. */
async function createDocument(title: string, subtitle: string, orientation: "portrait" | "landscape" = "portrait") {
  const [{ jsPDF }, tableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = tableModule.autoTable ?? tableModule.default;
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation });
  const margin = 40;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = margin;

  doc.setFillColor(234, 88, 12).rect(0, 0, doc.internal.pageSize.getWidth(), 6, "F");
  doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(28, 25, 23).text(title, margin, y + 10);
  y += 28;
  // The built-in PDF font has no en/em dash ("23 Oct – 27 Oct" would lose its dash).
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(100).text(subtitle.replace(/[–—]/g, "-"), margin, y);
  doc.text(`Generated ${formatDate(new Date().toISOString())} by BuildLedger`, margin, y + 14);
  doc.setTextColor(0);
  y += 34;

  const api = {
    heading(text: string) {
      if (y > pageHeight - 120) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(194, 65, 12).text(text, margin, y + 12);
      doc.setTextColor(0);
      y += 20;
    },
    note(text: string) {
      doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(110).text(text, margin, y + 8);
      doc.setTextColor(0);
      y += 22;
    },
    /** `right`: index from which columns are right-aligned, or the list of right-aligned columns (numbers). */
    table(head: string[], body: Cell[][], right: number | number[] = head.length, foot?: Cell[]) {
      const isRight = (i: number) => (Array.isArray(right) ? right.includes(i) : i >= right);
      autoTable(doc, {
        startY: y,
        head: [head],
        body,
        foot: foot ? [foot] : undefined,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak" },
        headStyles: { fillColor: [234, 88, 12], textColor: 255 },
        footStyles: { fillColor: [255, 241, 230], textColor: [28, 25, 23], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [250, 248, 245] },
        // Short values (a date, "12,000 Nos", "Part paid", "6.5 hrs x Rs. 1,200.00") stay on one line.
        columnStyles: Object.fromEntries(
          head.map((h, i) => {
            const minCellWidth = /date/i.test(h) ? 62 : /^status$/i.test(h) ? 82 : /quantity/i.test(h) ? 60 : /^charged$/i.test(h) ? 108 : undefined;
            return [i, { halign: isRight(i) ? "right" : "left", ...(minCellWidth && { minCellWidth }) }];
          }),
        ),
        didParseCell: (cell) => {
          if (cell.section !== "body" && isRight(cell.column.index)) cell.cell.styles.halign = "right";
        },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
    },
    save(fileName: string) {
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc
          .setPage(i)
          .setFontSize(8)
          .setTextColor(130)
          .text(`Page ${i} of ${pages}`, doc.internal.pageSize.getWidth() - margin, pageHeight - 20, { align: "right" });
      }
      doc.save(fileName);
      return doc;
    },
    doc,
  };
  return api;
}

const MODE_NAME = { day: "Daily", week: "Weekly", month: "Monthly", total: "Day 1 to today", custom: "Custom dates" } as const;

export async function buildPeriodReportPdf(report: PeriodReport, projectName: string, periodLabel: string) {
  const pdf = await createDocument(`${MODE_NAME[report.mode]} report - ${projectName}`, periodLabel);
  const t = report.totals;

  pdf.table(
    ["Summary", "Amount (Rs.)"],
    [
      ["Material purchases", money(t.materials)],
      ["Labour (workers & teams)", money(t.labour)],
      ["Transport & machinery", money(t.transport)],
      ["Total spent", money(t.spent)],
      ["Still owed on material & transport bills", money(t.billsDue)],
      ["Paid out", money(t.paid)],
      [`Outstanding dues as of ${formatDate(report.duesAsOf)}`, money(t.due)],
    ],
    1,
  );

  pdf.heading("Material purchases");
  if (report.materials.length === 0) pdf.note("No material purchases in this period.");
  else
    pdf.table(
      ["Date", "Material", "Status", "Quantity", "Price per unit (Rs.)", "Total (Rs.)", "Balance due (Rs.)"],
      report.materials.map((m) => [formatDate(m.date), m.material, status(m.status), `${num(m.quantity)} ${m.unit}`, money(m.unitPrice), money(m.amount), m.balance > 0 ? money(m.balance) : "-"]),
      3,
      ["Total", "", "", "", "", money(t.materials), money(report.materials.reduce((s, m) => s + m.balance, 0))],
    );

  pdf.heading("Labour");
  if (report.labour.length === 0) pdf.note("No attendance or team work in this period.");
  else
    pdf.table(
      ["Date", "Worker / team", "Details", "Amount (Rs.)"],
      report.labour.map((l) => [formatDate(l.date), l.name, l.detail, money(l.amount)]),
      3,
      ["Total", "", "", money(t.labour)],
    );

  pdf.heading("Transport & machinery");
  if (report.transport.length === 0) pdf.note("No vehicles hired in this period.");
  else
    pdf.table(
      ["Date", "Vehicle", "Transport", "Charged", "Status", "Amount (Rs.)", "Balance due (Rs.)"],
      report.transport.map((v) => [formatDate(v.date), v.vehicle, v.transportName || "-", v.hours !== null ? `${num(v.hours)} hrs x ${rs(v.ratePerHour ?? 0)}` : "Full amount", status(v.status), money(v.amount), v.balance > 0 ? money(v.balance) : "-"]),
      5,
      ["Total", "", "", "", "", money(t.transport), money(report.transport.reduce((s, v) => s + v.balance, 0))],
    );

  pdf.heading("Paid to workers & teams");
  if (report.payments.length === 0) pdf.note("Nothing paid in this period.");
  else
    pdf.table(
      ["Date", "Paid to", "Amount (Rs.)"],
      report.payments.map((p) => [formatDate(p.date), p.payee, money(p.amount)]),
      2,
      ["Total", "", money(t.paid)],
    );

  pdf.heading(`Outstanding dues as of ${formatDate(report.duesAsOf)}`);
  if (report.dues.length === 0) pdf.note("Nothing owed. All workers and teams are settled.");
  else
    pdf.table(
      ["Worker / team", "Type", "Last worked", "Earned (Rs.)", "Paid (Rs.)", "Due (Rs.)"],
      report.dues.map((d) => [d.name, d.kind, d.lastWorked ? formatDate(d.lastWorked) : "-", money(d.earned), money(d.paid), money(d.due)]),
      3,
      ["Total", "", "", "", "", money(t.due)],
    );

  return { pdf, fileName: `${slug(projectName)}-${report.mode === "total" ? "day-1-to-today" : report.mode}-report-${report.from}${report.to !== report.from ? `-to-${report.to}` : ""}.pdf` };
}

export async function downloadPeriodReportPdf(report: PeriodReport, projectName: string, periodLabel: string) {
  const { pdf, fileName } = await buildPeriodReportPdf(report, projectName, periodLabel);
  pdf.save(fileName);
}

/** One collection (materials, attendance, …) as a table PDF. */
export async function downloadTablePdf(options: {
  projectName: string;
  title: string;
  head: string[];
  rows: Cell[][];
  /** Right-aligned (numeric) columns. */
  rightColumns: number[];
  /** Totals row: a label in the first column and values for the given column indexes. */
  total?: { label: string; values: Record<number, string> };
}) {
  const wide = options.head.length > 6;
  const pdf = await createDocument(`${options.title} - ${options.projectName}`, `${options.rows.length} entries`, wide ? "landscape" : "portrait");
  if (options.rows.length === 0) pdf.note("Nothing recorded yet.");
  else {
    const foot = options.total ? options.head.map((_, i) => (i === 0 ? options.total!.label : (options.total!.values[i] ?? ""))) : undefined;
    pdf.table(options.head, options.rows, options.rightColumns, foot);
  }
  pdf.save(`${slug(options.projectName)}-${slug(options.title)}.pdf`);
}
