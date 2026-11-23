import { ToggleRight } from "lucide-react";
import { FeatureSwitches } from "@/components/admin/FeatureSwitches";
import { PageHeader } from "@/components/ui/primitives";
import { loadAppConfig } from "@/lib/server/app-settings";
import { requireAdminPage } from "@/lib/server/page-data";

export default async function AdminFeaturesPage() {
  await requireAdminPage("/admin/features");
  const config = await loadAppConfig();
  return (
    <>
      <PageHeader
        title="Features"
        description="Switch sections on or off for everyone, on the website and in the app. Turning one off hides it; nothing already recorded is deleted."
        icon={ToggleRight}
        accent="violet"
      />
      <FeatureSwitches initial={config.features} />
    </>
  );
}
