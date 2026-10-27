import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { getCurrentUser } from "@/lib/server/session";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-xl font-semibold tracking-tight">New project</h1>
        <p className="mt-1 mb-6 text-sm text-foreground/60">Only the name is required. You can fill in the rest later.</p>
        <Suspense fallback={null}>
          <SignedInForm />
        </Suspense>
      </main>
    </>
  );
}

async function SignedInForm() {
  if (!(await getCurrentUser())) redirect("/login?next=/projects/new");
  return <ProjectForm submitLabel="Create project" redirectTo="/projects/:id" />;
}
