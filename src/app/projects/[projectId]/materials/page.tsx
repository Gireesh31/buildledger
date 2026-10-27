import { Package } from "lucide-react";
import type { Metadata } from "next";
import { ExportPdfButton } from "@/components/reports/ExportPdfButtons";
import { RecordManager } from "@/components/records/RecordManager";
import { PageHeader } from "@/components/ui/primitives";
import { canWrite } from "@/lib/server/access";
import { listAttachments } from "@/lib/server/attachment-store";
import { requirePageAccess } from "@/lib/server/page-data";
import { listRecords } from "@/lib/server/record-store";

export const metadata: Metadata = { title: "Materials" };

export default async function MaterialsPage({ params }: PageProps<"/projects/[projectId]/materials">) {
  const { projectId } = await params;
  const { project, role } = await requirePageAccess(projectId);
  const [materials, attachments] = await Promise.all([listRecords("materials", projectId), listAttachments(projectId)]);

  return (
    <>
      <PageHeader
        icon={Package}
        accent="amber"
        title="Materials"
        description="Material purchases by quantity and price per unit. Scan the bill or speak to fill the form."
        actions={
          <ExportPdfButton projectId={projectId} projectName={project.name} collection="materials" title="Material purchases" />
        }
      />
      <RecordManager
        projectId={projectId}
        collection="materials"
        records={materials}
        canEdit={canWrite(role)}
        attachments={attachments.filter((a) => a.collection === "materials")}
        attachmentKind="bill"
        scan="material"
        catalog="material"
        voice="material"
        title="Material list"
        emptyText="No materials yet. Add one, scan a bill, or tap Speak material."
      />
    </>
  );
}
