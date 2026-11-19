import { router } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Alert, Platform } from "react-native";
import { Text } from "../../../src/text";
import { api, errorMessage } from "../../../src/api";
import { loadProject, useLoad, useProjectId } from "../../../src/data";
import { ProjectForm } from "../../../src/ProjectForm";
import { colors } from "../../../src/theme";
import { Button, Card, Loading, Message, Screen } from "../../../src/ui";

/** Edit the project's details, or delete it (owner only), as on the website's Settings page. */
export default function Settings() {
  const id = useProjectId();
  const { data: project, error, refreshing, onRefresh } = useLoad(() => loadProject(id), `settings:${id}`);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  if (!project) return error ? <Screen onRefresh={onRefresh}><Message text={error} /></Screen> : <Loading />;
  const owner = project.role === "owner";

  function confirmDelete() {
    const run = async () => {
      setDeleting(true);
      try {
        await api(`/api/projects/${id}`, { method: "DELETE" });
        router.dismissTo("/");
      } catch (e) {
        setDeleteError(errorMessage(e));
        setDeleting(false);
      }
    };
    if (Platform.OS === "web") return void run();
    Alert.alert(`Delete “${project!.name}”?`, "All its materials, labour, transport, daily logs, bills and photos are deleted for everyone. This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete project", style: "destructive", onPress: run },
    ]);
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {project.role === "viewer" ? (
        <Message text="You have view-only access, so you can't change this project's details." />
      ) : (
        <ProjectForm key={project.updatedAt} project={project} submitLabel="Save changes" onSubmit={(values) => api(`/api/projects/${id}`, { method: "PUT", body: values }).then(() => undefined)} />
      )}
      {owner ? (
        <Card title="Delete project">
          {deleteError ? <Message text={deleteError} /> : null}
          <Text style={{ color: colors.muted }}>Removes the project and everything recorded in it, for you and everyone you invited.</Text>
          <Button tone="danger" label="Delete this project" icon={<Trash2 size={17} color={colors.critical} />} busy={deleting} onPress={confirmDelete} />
        </Card>
      ) : null}
    </Screen>
  );
}
