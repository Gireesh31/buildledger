import { Users } from "lucide-react";
import type { Metadata } from "next";
import { ExportPdfButton } from "@/components/reports/ExportPdfButtons";
import { AttendanceSheet } from "@/components/labour/AttendanceSheet";
import { RecordManager } from "@/components/records/RecordManager";
import { Card, PageHeader } from "@/components/ui/primitives";
import { getCollection, isTeam, optionLabel, trades } from "@/lib/collections";
import { formatINR, formatNumber } from "@/lib/format";
import { computeLedger, LEDGER_COLLECTIONS } from "@/lib/ledger";
import { canWrite } from "@/lib/server/access";
import { requirePageAccess } from "@/lib/server/page-data";
import { loadRecords } from "@/lib/server/record-store";

export const metadata: Metadata = { title: "Labour" };

export default async function LabourPage({ params }: PageProps<"/projects/[projectId]/labour">) {
  const { projectId } = await params;
  const { project, role } = await requirePageAccess(projectId);
  const records = await loadRecords(projectId, LEDGER_COLLECTIONS);
  const { workerDues, labourCost } = computeLedger({ project, ...records });
  const tradeField = getCollection("workers").fields.find((f) => f.name === "trade")!;
  const editable = canWrite(role);
  // Attendance is only for individual workers; teams are paid a fixed amount.
  const individuals = records.workers.filter((w) => !isTeam(w));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={Users}
        accent="green"
        title="Labour"
        description="Workers are paid by attendance (present = 1 day, half day = ½ × daily wage). Teams are paid a fixed amount. Enter what you've paid in each worker's “Amount paid”."
        actions={
          <>
            <ExportPdfButton projectId={projectId} projectName={project.name} collection="attendance" title="Attendance" label="Attendance PDF" />
            <ExportPdfButton projectId={projectId} projectName={project.name} collection="workers" title="Workers & teams" label="Workers PDF" />
          </>
        }
      />

      <RecordManager
        formFirst
        multiple
        projectId={projectId}
        collection="workers"
        records={records.workers}
        canEdit={editable}
        extraColumns={[
          {
            label: "Due",
            values: Object.fromEntries(
              workerDues.map((w) => [
                w.id,
                w.due > 0
                  ? { text: formatINR(w.due), tone: "critical" as const }
                  : { text: w.due < 0 ? `${formatINR(-w.due)} advance` : "Paid" },
              ]),
            ),
          },
        ]}
        emptyText="No workers yet. Add individual workers (paid daily) or teams (paid a fixed amount)."
      />

      <Card title="Daily attendance">
        <AttendanceSheet
          projectId={projectId}
          workers={individuals.map((w) => ({
            id: w.id,
            name: String(w.name),
            trade: optionLabel(tradeField, w.trade),
            dailyWage: Number(w.dailyWage ?? 0),
          }))}
          attendance={records.attendance.map((a) => ({ date: String(a.date), workerId: String(a.workerId), status: String(a.status) }))}
          canEdit={editable}
        />
      </Card>

      {workerDues.length > 0 && (
        <Card title="Wages and dues" action={<span className="text-xs text-foreground/60">Total labour {formatINR(labourCost)}</span>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs text-foreground/60">
                <tr>
                  <th className="py-2 font-medium">Worker / team</th>
                  <th className="py-2 text-right font-medium">Days</th>
                  <th className="py-2 text-right font-medium">Earned</th>
                  <th className="py-2 text-right font-medium">Paid</th>
                  <th className="py-2 text-right font-medium">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {workerDues.map((w) => (
                  <tr key={w.id}>
                    <td className="py-2">
                      {w.name}{" "}
                      <span className="text-xs text-foreground/50">
                        {w.isTeam ? "Team · " : ""}
                        {trades.find((t) => t.value === w.trade)?.label}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums">{w.isTeam ? "—" : formatNumber(w.days)}</td>
                    <td className="py-2 text-right tabular-nums">{formatINR(w.earned)}</td>
                    <td className="py-2 text-right tabular-nums">{formatINR(w.paid)}</td>
                    <td className={`py-2 text-right font-medium tabular-nums ${w.due > 0 ? "text-critical" : ""}`}>
                      {w.due < 0 ? `${formatINR(-w.due)} advance` : formatINR(w.due)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

    </div>
  );
}
