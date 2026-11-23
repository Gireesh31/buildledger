import { ChevronRight, Search, Users } from "lucide-react";
import Link from "next/link";
import { buttonClass, inputClass, PageHeader } from "@/components/ui/primitives";
import { requireAdminPage } from "@/lib/server/page-data";
import { listAllUsers } from "@/lib/server/user-store";

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  await requireAdminPage("/admin/users");
  const q = (await searchParams).q;
  const search = typeof q === "string" ? q.slice(0, 100) : "";
  const users = await listAllUsers(search);

  return (
    <>
      <PageHeader title="Users" description="Every account. Open one to edit it, verify the email, disable it, make it an admin or delete it." icon={Users} accent="green" />
      <form className="mb-4 flex gap-2" role="search">
        <input name="q" defaultValue={search} placeholder="Search by name or email" className={inputClass} aria-label="Search users" />
        <button className={buttonClass("secondary")}>
          <Search className="h-4 w-4" aria-hidden /> Search
        </button>
      </form>
      <p className="mb-2 text-xs text-foreground/60">{users.length === 1 ? "1 user" : `${users.length} users`}</p>
      <ul className="divide-y divide-foreground/10 overflow-hidden rounded-xl border border-foreground/[0.07] bg-surface shadow-sm">
        {users.map((u) => (
          <li key={u.id}>
            <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-brand-soft">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {u.name}
                  {u.isAdmin && <Badge tone="brand">Admin</Badge>}
                  {u.disabledAt && <Badge tone="critical">Disabled</Badge>}
                  {!u.emailVerifiedAt && <Badge tone="muted">Unverified</Badge>}
                </p>
                <p className="truncate text-sm text-foreground/60">{u.email}</p>
              </div>
              <div className="hidden text-right text-xs text-foreground/60 sm:block">
                <p>Joined {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-foreground/40" aria-hidden />
            </Link>
          </li>
        ))}
        {users.length === 0 && <li className="px-4 py-6 text-center text-sm text-foreground/60">No users match “{search}”.</li>}
      </ul>
    </>
  );
}

function Badge({ tone, children }: { tone: "brand" | "critical" | "muted"; children: React.ReactNode }) {
  const style = tone === "brand" ? "bg-brand-soft text-brand" : tone === "critical" ? "bg-critical/10 text-critical" : "bg-foreground/10 text-foreground/60";
  return <span className={`ml-2 rounded-full px-2 py-0.5 align-middle text-[11px] font-medium ${style}`}>{children}</span>;
}
