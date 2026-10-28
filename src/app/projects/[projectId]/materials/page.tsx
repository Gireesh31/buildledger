import { AlertCircle, Hash, IndianRupee, Package } from "lucide-react";
import type { Metadata } from "next";
import { ExportPdfButton } from "@/components/reports/ExportPdfButtons";
import { RecordManager } from "@/components/records/RecordManager";
import { PageHeader, StatTile } from "@/components/ui/primitives";
import { formatINR } from "@/lib/format";
import { balanceDue, outstandingBills } from "@/lib/ledger";
import { canWrite } from "@/lib/server/access";
import { listAttachments } from "@/lib/server/attachment-store";
import { requirePageAccess } from "@/lib/server/page-data";
import { listRecords } from "@/lib/server/record-store";

export const metadata: Metadata = { title: "Materials" };

export default async function MaterialsPage({ params }: PageProps<"/projects/[projectId]/materials">) {
  const { projectId } = await params;
  const { project, role } = await requirePageAccess(projectId);
  const [materials, attachments] = await Promise.all([listRecords("materials", projectId), listAttachments(projectId)]);
  const spent = materials.reduce((s, m) => s + (typeof m.amount === "number" ? m.amount : 0), 0);
  const due = outstandingBills(materials);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Package}
        accent="amber"
        title="Materials"
        description="Material purchases by quantity and price per unit. Scan the bill to fill the form."
        actions={
          <ExportPdfButton projectId={projectId} projectName={project.name} collection="materials" title="Material purchases" />
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile index={0} icon={IndianRupee} accent="amber" label="Material spend" value={formatINR(spent)} />
        <StatTile
          index={1}
          icon={AlertCircle}
          accent="rose"
          label="Outstanding due"
          value={formatINR(due.amount)}
          hint={due.count > 0 ? `${due.count} bill${due.count === 1 ? "" : "s"} not fully paid` : "No unpaid bills"}
          tone={due.amount > 0 ? "critical" : undefined}
        />
        <StatTile index={2} icon={Hash} accent="orange" label="Entries" value={String(materials.length)} />
      </div>
      <RecordManager
        formFirst
        multiple
        projectId={projectId}
        collection="materials"
        records={materials}
        canEdit={canWrite(role)}
        extraColumns={[
          {
            label: "Balance due",
            values: Object.fromEntries(materials.filter((r) => balanceDue(r) > 0).map((r) => [r.id, { text: formatINR(balanceDue(r)), tone: "critical" as const }])),
          },
        ]}
        attachments={attachments.filter((a) => a.collection === "materials")}
        attachmentKind="bill"
        scan="material"
        catalog="material"
        title="Material list"
        emptyText="No materials yet. Add one or scan a bill."
      />
    </div>
  );
}
