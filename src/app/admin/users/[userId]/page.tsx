import { ArrowLeft, UserCog } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminUserEditor } from "@/components/admin/AdminUserEditor";
import { PageHeader } from "@/components/ui/primitives";
import { requireAdminPage } from "@/lib/server/page-data";
import { listProjectsFor } from "@/lib/server/project-store";
import { findUserById } from "@/lib/server/user-store";

export default async function AdminUserPage({ params }: PageProps<"/admin/users/[userId]">) {
  const { userId } = await params;
  const admin = await requireAdminPage(`/admin/users/${userId}`);
  const user = await findUserById(userId);
  if (!user) notFound();
  const projects = await listProjectsFor(user.id);

  return (
    <>
      <Link href="/admin/users" className="mb-4 inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All users
      </Link>
      <PageHeader title={user.name} description={user.email} icon={UserCog} accent="green" />
      <AdminUserEditor user={user} isSelf={user.id === admin.id} projects={projects.map((p) => ({ id: p.id, name: p.name, status: p.status }))} />
    </>
  );
}
