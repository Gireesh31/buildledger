import { useState } from "react";
import type { Project } from "@/lib/types";
import { projectStatuses, projectTypes } from "@/lib/validation";
import { errorMessage } from "./api";
import { ChoiceInput, DateInput, SelectInput } from "./inputs";
import { Button, Card, Field, Input, Message } from "./ui";

export type ProjectValues = {
  name: string;
  description: string;
  location: string;
  projectType: string;
  status: string;
  budget: string;
  areaSqft: string;
  startDate: string;
  endDate: string;
};

const toValues = (p?: Project): ProjectValues => ({
  name: p?.name ?? "",
  description: p?.description ?? "",
  location: p?.location ?? "",
  projectType: p?.projectType ?? "residential",
  status: p?.status ?? "planning",
  budget: p?.budget ? String(p.budget) : "",
  areaSqft: p?.areaSqft ? String(p.areaSqft) : "",
  startDate: p?.startDate ?? "",
  endDate: p?.endDate ?? "",
});

/** The website's project details form (new project and settings); the server checks the values. */
export function ProjectForm({ project, submitLabel, onSubmit }: { project?: Project; submitLabel: string; onSubmit: (values: ProjectValues) => Promise<void> }) {
  const [values, setValues] = useState(() => toValues(project));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = (name: keyof ProjectValues) => (value: string) => {
    setSaved(false);
    setValues((v) => ({ ...v, [name]: value }));
  };

  async function submit() {
    setPending(true);
    setError(null);
    try {
      await onSubmit(values);
      setSaved(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card title={project ? "Project details" : undefined}>
      <Field label="Project name" required>
        <Input value={values.name} onChangeText={set("name")} placeholder="e.g. Sharma residence" />
      </Field>
      <Field label="Location">
        <Input value={values.location} onChangeText={set("location")} placeholder="e.g. Tumakuru" />
      </Field>
      <Field label="Type">
        <SelectInput title="Project type" value={values.projectType} options={projectTypes} onChange={set("projectType")} />
      </Field>
      <Field label="Status">
        <ChoiceInput value={values.status} options={projectStatuses} onChange={set("status")} />
      </Field>
      <Field label="Budget">
        <Input prefix="₹" value={values.budget} onChangeText={set("budget")} numeric placeholder="0" />
      </Field>
      <Field label="Built-up area (sq ft)">
        <Input value={values.areaSqft} onChangeText={set("areaSqft")} numeric placeholder="e.g. 2400" />
      </Field>
      <Field label="Start date">
        <DateInput value={values.startDate} onChange={set("startDate")} />
      </Field>
      <Field label="Expected end date">
        <DateInput value={values.endDate} onChange={set("endDate")} />
      </Field>
      <Field label="Description">
        <Input value={values.description} onChangeText={set("description")} multiline placeholder="Floors, plot size, anything worth noting" maxLength={500} />
      </Field>
      {error ? <Message text={error} /> : null}
      {saved && project ? <Message tone="success" text="Saved." /> : null}
      <Button label={submitLabel} busy={pending} disabled={!values.name.trim()} onPress={submit} />
    </Card>
  );
}
