import { NotebookPen } from "lucide-react";
import type { Metadata } from "next";
import { ExportPdfButton } from "@/components/reports/ExportPdfButtons";
import { RecordManager } from "@/components/records/RecordManager";
import { PageHeader } from "@/components/ui/primitives";
import { canWrite } from "@/lib/server/access";
import { listAttachments } from "@/lib/server/attachment-store";
import { requirePageAccess } from "@/lib/server/page-data";
import { listRecords } from "@/lib/server/record-store";

export const metadata: Metadata = { title: "Daily log" };

export default async function DailyLogPage({ params }: PageProps<"/projects/[projectId]/daily-log">) {
  const { projectId } = await params;
  const { project, role } = await requirePageAccess(projectId);
  const [logs, attachments] = await Promise.all([listRecords("dailyLogs", projectId), listAttachments(projectId)]);

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
