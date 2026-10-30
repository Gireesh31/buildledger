import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProfileForm, ProfilePhoto } from "@/components/account/AccountForms";
import { AppHeader } from "@/components/layout/AppHeader";
import { BackButton } from "@/components/ui/BackButton";
import { formatDate } from "@/lib/format";
import { listAllProjects } from "@/lib/server/project-store";
import { getCurrentUser } from "@/lib/server/session";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="mb-4 -ml-2">
          <BackButton />
        </div>
        <Suspense fallback={<div className="skeleton h-96 rounded-xl" />}>
          <ProfileContent />
        </Suspense>
      </main>
    </>
  );
}

async function ProfileContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");
  const ownedProjects = (await listAllProjects()).filter((p) => p.ownerId === user.id).length;
  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="animate-fade-up overflow-hidden rounded-xl border border-foreground/[0.07] bg-surface shadow-sm">
      <div className="relative bg-brand px-6 pb-14 pt-6 text-white">
        <div aria-hidden className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
        <h1 className="relative text-xl font-semibold">Your profile</h1>
        <p className="relative text-sm text-white/85">Your details and how you sign in. Member since {formatDate(user.createdAt)}.</p>
      </div>
      <div className="px-6 pb-6">
        <div className="relative -mt-8 mb-6 flex flex-wrap items-end gap-x-5 gap-y-3">
          <ProfilePhoto photoUrl={user.photoUrl} initials={initials} />
          <div className="pb-1">
            <p className="text-lg font-semibold leading-tight">{user.name}</p>
            <p className="text-sm text-foreground/60">{user.email}</p>
          </div>
        </div>
        <ProfileForm
          firstName={user.firstName}
          lastName={user.lastName}
          phone={user.phone ?? ""}
          email={user.email}
          location={user.location ?? ""}
          ownedProjects={ownedProjects}
        />
      </div>
    </section>
  );
}
