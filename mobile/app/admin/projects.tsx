import { router } from "expo-router";
import { useState } from "react";
import { formatINR } from "@/lib/format";
import type { Project, User } from "@/lib/types";
import { projectStatuses } from "@/lib/validation";
import { api } from "../../src/api";
import { NavRow } from "../../src/admin-ui";
import { useLoad } from "../../src/data";
import { Empty, Input, Loading, Message, Screen } from "../../src/ui";

interface Row {
  project: Project;
  owner?: Pick<User, "id" | "name" | "email">;
  entries: number;
  billed: number;
}

/** Every project. Tapping one opens the normal project screens with full access, so edits show everywhere. */
export default function AdminProjects() {
  const [search, setSearch] = useState("");
  const { data, error, refreshing, onRefresh } = useLoad(() => api<Row[]>("/api/admin/projects"), "admin-projects");
  if (!data && !error) return <Loading />;
  const term = search.trim().toLowerCase();
  const rows = (data ?? []).filter(
    ({ project, owner }) => !term || [project.name, project.location, owner?.name, owner?.email].some((v) => v?.toLowerCase().includes(term)),
  );
  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh} animate={false}>
      {error ? <Message text={error} /> : null}
      <Input value={search} onChangeText={setSearch} placeholder="Search projects or owners" autoCorrect={false} />
      {rows.length === 0 ? <Empty text="No projects found." /> : null}
      {rows.map(({ project, owner, entries, billed }) => (
        <NavRow
          key={project.id}
          label={project.name}
          hint={`${projectStatuses.find((s) => s.value === project.status)?.label ?? project.status} · ${owner?.name ?? "Unknown owner"} · ${entries} entries · ${formatINR(billed)} billed`}
          onPress={() => router.push(`/projects/${project.id}`)}
        />
      ))}
    </Screen>
  );
}
