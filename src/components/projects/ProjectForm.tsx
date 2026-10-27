"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormMessage, sendJson } from "@/components/auth/form";
import { buttonClass, inputClass } from "@/components/ui/primitives";
import type { Project } from "@/lib/types";
import { projectStatuses, projectTypes } from "@/lib/validation";

export type ProjectFieldName =
  | "name"
  | "location"
  | "projectType"
  | "description"
  | "budget"
  | "areaSqft"
  | "startDate"
  | "endDate"
  | "status";

export const ALL_PROJECT_FIELDS: ProjectFieldName[] = [
  "name",
  "location",
  "projectType",
  "status",
  "budget",
  "areaSqft",
  "startDate",
  "endDate",
  "description",
];

interface ProjectFormProps {
  project?: Pick<Project, "id"> & Partial<Project>;
  fields?: ProjectFieldName[];
  submitLabel?: string;
  /** Where to go after saving, e.g. "/projects/:id" (":id" becomes the saved project id). */
  redirectTo?: string;
  secondaryAction?: React.ReactNode;
}

export function ProjectForm({ project, fields = ALL_PROJECT_FIELDS, submitLabel = "Save", redirectTo, secondaryAction }: ProjectFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const show = (name: ProjectFieldName) => fields.includes(name);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(fields.map((name) => [name, form.get(name) ?? ""]));
    setPending(true);
    setError(null);
    setSaved(false);
    const result = project?.id
      ? await sendJson<Project>(`/api/projects/${project.id}`, body, "PUT")
      : await sendJson<Project>("/api/projects", body);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (redirectTo) {
      setPending(true);
      router.push(redirectTo.replace(":id", result.data.id));
    } else {
      setSaved(true);
    }
    router.refresh();
  }

  const label = (text: string, required = false) => (
    <span className="font-medium text-foreground/80">
      {text}
      {required && <span className="text-critical"> *</span>}
    </span>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <FormMessage tone="error">{error}</FormMessage>}
      {saved && <FormMessage tone="success">Project details saved.</FormMessage>}
      <div className="grid gap-4 sm:grid-cols-2">
        {show("name") && (
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            {label("Project name", true)}
            <input name="name" required maxLength={100} defaultValue={project?.name} placeholder="e.g. Sharma residence, Whitefield" className={inputClass} />
          </label>
        )}
        {show("location") && (
          <label className="flex flex-col gap-1 text-sm">
            {label("Site location")}
            <input name="location" maxLength={200} defaultValue={project?.location} placeholder="Area, city" className={inputClass} />
          </label>
        )}
        {show("projectType") && (
          <label className="flex flex-col gap-1 text-sm">
            {label("Project type")}
            <select name="projectType" defaultValue={project?.projectType ?? "residential"} className={inputClass}>
              {projectTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {show("status") && (
          <label className="flex flex-col gap-1 text-sm">
            {label("Status")}
            <select name="status" defaultValue={project?.status ?? "planning"} className={inputClass}>
              {projectStatuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {show("budget") && (
          <label className="flex flex-col gap-1 text-sm">
            {label("Total budget (₹)")}
            <input name="budget" type="number" inputMode="decimal" min={0} step="1" defaultValue={project?.budget} placeholder="e.g. 4500000" className={inputClass} />
          </label>
        )}
        {show("areaSqft") && (
          <label className="flex flex-col gap-1 text-sm">
            {label("Built-up area (sq ft)")}
            <input name="areaSqft" type="number" inputMode="decimal" min={0} step="any" defaultValue={project?.areaSqft} placeholder="e.g. 2400" className={inputClass} />
          </label>
        )}
        {show("startDate") && (
          <label className="flex flex-col gap-1 text-sm">
            {label("Start date")}
            <input name="startDate" type="date" defaultValue={project?.startDate} className={inputClass} />
          </label>
        )}
        {show("endDate") && (
          <label className="flex flex-col gap-1 text-sm">
            {label("Expected completion")}
            <input name="endDate" type="date" defaultValue={project?.endDate} className={inputClass} />
          </label>
        )}
        {show("description") && (
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            {label("Notes")}
            <textarea name="description" rows={3} maxLength={500} defaultValue={project?.description} placeholder="Client, scope, floors…" className={inputClass} />
          </label>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>{secondaryAction}</div>
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
