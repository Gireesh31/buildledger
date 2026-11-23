import { Megaphone } from "lucide-react";
import { AnnouncementsEditor } from "@/components/admin/AnnouncementsEditor";
import { PageHeader } from "@/components/ui/primitives";
import { listAllAnnouncements } from "@/lib/server/app-settings";
import { requireAdminPage } from "@/lib/server/page-data";

export default async function AdminAnnouncementsPage() {
  await requireAdminPage("/admin/announcements");
  const items = await listAllAnnouncements();
  return (
    <>
      <PageHeader
        title="Announcements"
        description="News, new features and offers. Live ones show on the website dashboard and the app’s home screen; people can close them."
        icon={Megaphone}
        accent="rose"
      />
      <AnnouncementsEditor initial={items} />
    </>
  );
}
