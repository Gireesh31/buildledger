import { ListChecks } from "lucide-react";
import { FormsEditor } from "@/components/admin/FormsEditor";
import { PageHeader } from "@/components/ui/primitives";
import { loadAppConfig } from "@/lib/server/app-settings";
import { requireAdminPage } from "@/lib/server/page-data";

export default async function AdminFormsPage() {
  await requireAdminPage("/admin/forms");
  const config = await loadAppConfig();
  return (
    <>
      <PageHeader
        title="Forms"
        description="Change the dropdown choices and add your own fields to the entry forms. Saved changes show up in the website and the app."
        icon={ListChecks}
        accent="amber"
      />
      <FormsEditor initial={config.forms} />
    </>
  );
}
