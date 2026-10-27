import Link from "next/link";
import { ProjectForm } from "@/components/projects/ProjectForm";

export default function CreateProjectPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add your construction site</h1>
        <p className="mt-1 text-foreground/60">You can change these details later.</p>
      </div>
      <ProjectForm
        fields={["name", "location", "projectType", "description"]}
        submitLabel="Continue"
        redirectTo="/onboarding/:id/setup"
        secondaryAction={
          <Link href="/onboarding" className="text-sm text-foreground/60 hover:underline">
            Back
          </Link>
        }
      />
    </div>
  );
}
