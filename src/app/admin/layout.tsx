import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { AppHeader } from "@/components/layout/AppHeader";
import { getCurrentUser } from "@/lib/server/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <AppHeader />
      <Suspense fallback={<div className="skeleton mx-auto mt-6 h-32 w-full max-w-6xl rounded-2xl" />}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </>
  );
}

/** Only admins get past here; everyone else sees a plain 404, so the panel isn't advertised. */
async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!user.isAdmin) notFound();
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <AdminNav />
      <main className="mt-6">{children}</main>
    </div>
  );
}
