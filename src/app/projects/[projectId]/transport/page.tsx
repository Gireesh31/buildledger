import { Clock, Truck } from "lucide-react";
import type { Metadata } from "next";
import { ExportPdfButton } from "@/components/reports/ExportPdfButtons";
import { RecordManager } from "@/components/records/RecordManager";
import { PageHeader, StatTile } from "@/components/ui/primitives";
import { formatINR, formatNumber } from "@/lib/format";
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
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile index={0} icon={Truck} accent="violet" label="Transport cost" value={formatINR(total)} />
        <StatTile index={1} icon={Clock} accent="blue" label="Hours hired" value={formatNumber(hours)} hint="Per-hour vehicles only" />
        <StatTile index={2} icon={Truck} accent="orange" label="Entries" value={String(vehicles.length)} />
      </div>
      <RecordManager
        formFirst
        multiple
        projectId={projectId}
        collection="transport"
        records={vehicles}
        canEdit={canWrite(role)}
        catalog="vehicle"
        attachments={attachments.filter((a) => a.collection === "transport")}
        attachmentKind="bill"
        title="Vehicles hired"
        emptyText="No vehicles yet. Tap + on a vehicle to add it."
      />
    </div>
  );
}
