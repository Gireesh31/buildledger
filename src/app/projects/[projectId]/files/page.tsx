import { Images } from "lucide-react";
import type { Metadata } from "next";
import { FileGallery } from "@/components/files/FileGallery";
import { PageHeader } from "@/components/ui/primitives";
import { canWrite } from "@/lib/server/access";
import { listAttachments } from "@/lib/server/attachment-store";
import { requireFeature, requirePageAccess } from "@/lib/server/page-data";

export const metadata: Metadata = { title: "Bills & photos" };

export default async function FilesPage({ params }: PageProps<"/projects/[projectId]/files">) {
  const { projectId } = await params;
  // The data loads alongside the access check (it's only shown once that passes), not after it.
  const [{ role }, files] = await Promise.all([requirePageAccess(projectId), listAttachments(projectId)]);
  await requireFeature("files");

  return (
    <>
      <PageHeader
        icon={Images}
        accent="rose"
        title="Bills & photos"
        description="Every bill, receipt and site photo for this project, including those attached to materials and daily logs."
      />
      <FileGallery projectId={projectId} files={files} canEdit={canWrite(role)} />
    </>
  );
}
