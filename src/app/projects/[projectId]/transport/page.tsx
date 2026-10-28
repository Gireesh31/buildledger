import { AlertCircle, Clock, Truck } from "lucide-react";
import type { Metadata } from "next";
import { ExportPdfButton } from "@/components/reports/ExportPdfButtons";
import { RecordManager } from "@/components/records/RecordManager";
import { PageHeader, StatTile } from "@/components/ui/primitives";
import { formatINR, formatNumber } from "@/lib/format";
import { balanceDue, outstandingBills } from "@/lib/ledger";
import { canWrite } from "@/lib/server/access";
import { listAttachments } from "@/lib/server/attachment-store";
import { requirePageAccess } from "@/lib/server/page-data";
import { listRecords } from "@/lib/server/record-store";

export const metadata: Metadata = { title: "Transport" };

export default async function TransportPage({ params }: PageProps<"/projects/[projectId]/transport">) {
  const { projectId } = await params;
  const { project, role } = await requirePageAccess(projectId);
  const [vehicles, attachments] = await Promise.all([listRecords("transport", projectId), listAttachments(projectId)]);
  const total = vehicles.reduce((s, v) => s + (typeof v.amount === "number" ? v.amount : 0), 0);
  const due = outstandingBills(vehicles);
  const hours = vehicles.reduce((s, v) => s + (v.chargeType === "hourly" && typeof v.hours === "number" ? v.hours : 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Truck}
        accent="violet"
        title="Transport"
        description="JCBs, cranes, trucks, tractors and other machinery hired for the site, charged per hour or as a full amount."
        actions={
          <ExportPdfButton projectId={projectId} projectName={project.name} collection="transport" title="Transport" />
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile index={0} icon={Truck} accent="violet" label="Transport cost" value={formatINR(total)} />
        <StatTile
          index={1}
          icon={AlertCircle}
          accent="rose"
          label="Outstanding due"
          value={formatINR(due.amount)}
          hint={due.count > 0 ? `${due.count} bill${due.count === 1 ? "" : "s"} not fully paid` : "No unpaid bills"}
          tone={due.amount > 0 ? "critical" : undefined}
        />
        <StatTile index={2} icon={Clock} accent="blue" label="Hours hired" value={formatNumber(hours)} hint="Per-hour vehicles only" />
        <StatTile index={3} icon={Truck} accent="orange" label="Entries" value={String(vehicles.length)} />
      </div>
      <RecordManager
        formFirst
        multiple
        projectId={projectId}
        collection="transport"
        records={vehicles}
        canEdit={canWrite(role)}
        extraColumns={[
          {
            label: "Balance due",
            values: Object.fromEntries(vehicles.filter((r) => balanceDue(r) > 0).map((r) => [r.id, { text: formatINR(balanceDue(r)), tone: "critical" as const }])),
          },
        ]}
        catalog="vehicle"
        attachments={attachments.filter((a) => a.collection === "transport")}
        attachmentKind="bill"
        title="Vehicles hired"
        emptyText="No vehicles yet. Tap + on a vehicle to add it."
      />
    </div>
  );
}
