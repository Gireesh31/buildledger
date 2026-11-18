import { router } from "expo-router";
import type { Project } from "@/lib/types";
import { api } from "../../src/api";
import { ProjectForm } from "../../src/ProjectForm";
import { Screen } from "../../src/ui";

/** The same project details as the website's "New project" form. */
export default function NewProject() {
  return (
    <Screen>
      <ProjectForm
        submitLabel="Create project"
        onSubmit={async (values) => {
          const project = await api<Project>("/api/projects", { body: values });
          router.replace(`/projects/${project.id}`);
        }}
      />
    </Screen>
  );
}
