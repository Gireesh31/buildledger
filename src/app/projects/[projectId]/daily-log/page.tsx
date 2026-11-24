import { NotebookPen } from "lucide-react";
import type { Metadata } from "next";
import { ExportPdfButton } from "@/components/reports/ExportPdfButtons";
import { RecordManager } from "@/components/records/RecordManager";
import { PageHeader } from "@/components/ui/primitives";
import { canWrite } from "@/lib/server/access";
import { listAttachments } from "@/lib/server/attachment-store";
import { requireFeature, requirePageAccess } from "@/lib/server/page-data";
import { listRecords } from "@/lib/server/record-store";

export const metadata: Metadata = { title: "Daily log" };

export default async function DailyLogPage({ params }: PageProps<"/projects/[projectId]/daily-log">) {
  const { projectId } = await params;
  // The data loads alongside the access check (it's only shown once that passes), not after it.
  const [{ project, role }, logs, attachments] = await Promise.all([
    requirePageAccess(projectId),
    listRecords("dailyLogs", projectId),
    listAttachments(projectId),
  ]);
  await requireFeature("dailyLog");

  return (
    <>
      <PageHeader
        icon={NotebookPen}
        accent="violet"
        title="Daily site log"
        description="What happened on site each day, with photos."
        actions={
          <ExportPdfButton projectId={projectId} projectName={project.name} collection="dailyLogs" title="Daily log" />
        }
      />
      <RecordManager
        formFirst
        projectId={projectId}
        collection="dailyLogs"
        records={logs}
        canEdit={canWrite(role)}
        attachments={attachments.filter((a) => a.collection === "dailyLogs")}
        attachmentKind="photo"
        title="Entries"
      />
    </>
  );
}
