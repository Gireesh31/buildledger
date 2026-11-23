import { ShieldCheck, UserCheck, Users } from "lucide-react";
import { PageHeader, StatTile } from "@/components/ui/primitives";
import { getAdminStats } from "@/lib/server/admin-store";
import { requireAdminPage } from "@/lib/server/page-data";

export default async function AdminOverview() {
  await requireAdminPage();
  const stats = await getAdminStats();

  return (
    <>
      <PageHeader title="Overview" description="Everyone using BuildLedger, across the website and the app." icon={ShieldCheck} />
      <div className="grid gap-3 sm:grid-cols-2">
        <StatTile index={0} icon={Users} accent="orange" label="Users" value={String(stats.users)} />
        <StatTile index={1} icon={UserCheck} accent="green" label="Verified emails" value={String(stats.verifiedUsers)} />
      </div>
    </>
  );
}
