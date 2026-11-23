import { FileText, FolderKanban, Images, ShieldCheck, Truck, UserCheck, Users, Wallet } from "lucide-react";
import { PageHeader, StatTile } from "@/components/ui/primitives";
import { getCollection, isCollectionName } from "@/lib/collections";
import { formatINR } from "@/lib/format";
import { getAdminStats } from "@/lib/server/admin-store";
import { requireAdminPage } from "@/lib/server/page-data";
import { projectStatuses } from "@/lib/validation";

export default async function AdminOverview() {
  await requireAdminPage();
  const stats = await getAdminStats();
  const entries = Object.entries(stats.recordsByCollection).sort(([, a], [, b]) => b - a);

  return (
    <>
      <PageHeader title="Overview" description="Everyone using BuildLedger, across the website and the app." icon={ShieldCheck} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile index={0} icon={Users} accent="orange" label="Users" value={String(stats.users)} hint={`${stats.newUsers30d} joined in the last 30 days`} />
        <StatTile index={1} icon={UserCheck} accent="green" label="Verified emails" value={String(stats.verifiedUsers)} hint={`${stats.disabledUsers} disabled · ${stats.admins} admins`} />
        <StatTile index={2} icon={FolderKanban} accent="blue" label="Projects" value={String(stats.projects)} />
        <StatTile index={3} icon={FileText} accent="violet" label="Entries" value={String(stats.records)} hint={`${stats.files} bills & photos`} />
        <StatTile index={4} icon={Wallet} accent="amber" label="Material bills" value={formatINR(stats.materialSpend)} />
        <StatTile index={5} icon={Truck} accent="blue" label="Transport bills" value={formatINR(stats.transportSpend)} />
        <StatTile index={6} icon={Users} accent="green" label="Paid to workers" value={formatINR(stats.labourPaid)} hint="“Amount paid” on worker and team entries" />
        <StatTile index={7} icon={Images} accent="rose" label="Files" value={String(stats.files)} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-foreground/[0.07] bg-surface p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">Projects by status</h2>
          <ul className="divide-y divide-foreground/10 text-sm">
            {projectStatuses.map((s) => (
              <li key={s.value} className="flex justify-between py-2">
                <span>{s.label}</span>
                <span className="tabular-nums font-medium">{stats.projectsByStatus[s.value] ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-foreground/[0.07] bg-surface p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">Entries by section</h2>
          {entries.length === 0 ? (
            <p className="text-sm text-foreground/60">No entries yet.</p>
          ) : (
            <ul className="divide-y divide-foreground/10 text-sm">
              {entries.map(([name, count]) => (
                <li key={name} className="flex justify-between py-2">
                  <span>{isCollectionName(name) ? getCollection(name).label : name}</span>
                  <span className="tabular-nums font-medium">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
