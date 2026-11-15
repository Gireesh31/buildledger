import { router } from "expo-router";
import { useState } from "react";
import type { Project } from "@/lib/types";
import { projectStatuses, projectTypes } from "@/lib/validation";
import { api, errorMessage } from "../../src/api";
import { ChoiceInput, DateInput, SelectInput } from "../../src/inputs";
import { Button, Card, Field, Input, Message, Screen } from "../../src/ui";

/** The same project details as the website's "New project" form; the server checks them. */
export default function NewProject() {
  const [values, setValues] = useState({ name: "", location: "", projectType: "residential", status: "planning", budget: "", areaSqft: "", startDate: "", endDate: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (name: keyof typeof values) => (value: string) => setValues((v) => ({ ...v, [name]: value }));

  async function create() {
    setPending(true);
    setError(null);
    try {
      const project = await api<Project>("/api/projects", { body: values });
      router.replace(`/projects/${project.id}`);
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  }

  return (
    <Screen>
      <Card>
        {error ? <Message text={error} /> : null}
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
          <Input prefix="₹" value={values.budget} onChangeText={set("budget")} keyboardType="decimal-pad" placeholder="0" />
        </Field>
        <Field label="Built-up area (sq ft)">
          <Input value={values.areaSqft} onChangeText={set("areaSqft")} keyboardType="decimal-pad" placeholder="e.g. 2400" />
        </Field>
        <Field label="Start date">
          <DateInput value={values.startDate} onChange={set("startDate")} />
        </Field>
        <Field label="Expected end date">
          <DateInput value={values.endDate} onChange={set("endDate")} />
        </Field>
        <Button label="Create project" busy={pending} disabled={!values.name.trim()} onPress={create} />
      </Card>
    </Screen>
  );
}
