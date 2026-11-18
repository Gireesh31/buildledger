import { Mail, Trash2, UserPlus } from "lucide-react-native";
import { useState } from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import { formatDate } from "@/lib/format";
import type { Invite } from "@/lib/types";
import { api, errorMessage } from "../../../src/api";
import { useAuth } from "../../../src/auth";
import { loadProject, useLoad, useProjectId } from "../../../src/data";
import { colors } from "../../../src/theme";
import { Badge, Button, Card, Chip, Empty, Field, Input, Loading, Message, Screen } from "../../../src/ui";

const ROLES = [
  { value: "editor", label: "Can edit", hint: "Add and change entries" },
  { value: "viewer", label: "View only", hint: "See everything, change nothing" },
] as const;

/** Who can see this project, and inviting more people (owner only), as on the website's Team page. */
export default function Team() {
  const id = useProjectId();
  const { user } = useAuth();
  const { data, error, refreshing, reload, onRefresh } = useLoad(async () => {
    const [project, invites] = await Promise.all([loadProject(id), api<Invite[]>(`/api/projects/${id}/invites`)]);
    return { project, invites };
  });
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<{ text: string; tone: "error" | "success" } | null>(null);

  if (!data) return error ? <Screen onRefresh={onRefresh}><Message text={error} /></Screen> : <Loading />;
  const owner = data.project.role === "owner";

  async function invite() {
    const list = emails.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
    if (list.length === 0) return;
    setPending(true);
    setNote(null);
    try {
      const created = await api<Invite[]>(`/api/projects/${id}/invites`, { body: { emails: list, role } });
      setEmails("");
      setNote({ text: created.length === 1 ? `Invited ${created[0].email}. They'll see this project when they sign in with that email.` : `Invited ${created.length} people.`, tone: "success" });
      await reload();
    } catch (e) {
      setNote({ text: errorMessage(e), tone: "error" });
    } finally {
      setPending(false);
    }
  }

  function remove(item: Invite) {
    const run = async () => {
      try {
        await api(`/api/projects/${id}/invites/${item.id}`, { method: "DELETE" });
        await reload();
      } catch (e) {
        setNote({ text: errorMessage(e), tone: "error" });
      }
    };
    if (Platform.OS === "web") return void run();
    Alert.alert("Remove access?", `${item.email} will no longer see this project.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: run },
    ]);
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {note ? <Message text={note.text} tone={note.tone} /> : null}
      {owner ? (
        <Card title="Invite people">
          <Field label="Email addresses">
            <Input value={emails} onChangeText={setEmails} placeholder="name@example.com, another@example.com" autoCapitalize="none" keyboardType="email-address" autoCorrect={false} />
          </Field>
          <Field label="They can">
            <View style={{ flexDirection: "row", gap: 8 }}>
              {ROLES.map((r) => (
                <Chip key={r.value} label={r.label} selected={role === r.value} onPress={() => setRole(r.value)} />
              ))}
            </View>
            <Text style={{ fontSize: 12, color: colors.muted }}>{ROLES.find((r) => r.value === role)?.hint}</Text>
          </Field>
          <Button label="Send invite" icon={<UserPlus size={17} color="#fff" />} busy={pending} disabled={!emails.trim()} onPress={invite} />
        </Card>
      ) : (
        <Message tone="success" text={`You have ${data.project.role === "editor" ? "edit" : "view-only"} access. Only the owner can invite people.`} />
      )}

      <Card title={`People with access (${data.invites.length + 1})`}>
        <Person name={owner ? `${user?.name ?? "You"} (you)` : "Project owner"} detail={owner ? user?.email ?? "" : "Created this project"} badge="Owner" />
        {data.invites.length === 0 ? <Empty text="Nobody else yet. Invite your engineer, contractor or family." /> : null}
        {data.invites.map((item) => (
          <Person
            key={item.id}
            name={item.email}
            detail={`Invited ${formatDate(item.createdAt)}`}
            badge={item.role === "editor" ? "Can edit" : "View only"}
            onRemove={owner ? () => remove(item) : undefined}
          />
        ))}
      </Card>
    </Screen>
  );
}

function Person({ name, detail, badge, onRemove }: { name: string; detail: string; badge: string; onRemove?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
      <View style={{ backgroundColor: colors.brandSoft, borderRadius: 999, padding: 9 }}>
        <Mail size={16} color={colors.brand} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={{ fontWeight: "600", color: colors.text }} numberOfLines={1}>
          {name}
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted }} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <Badge label={badge} bg={badge === "Owner" ? colors.brandSoft : colors.infoSoft} fg={badge === "Owner" ? colors.brandStrong : colors.info} />
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel={`Remove ${name}`}>
          <Trash2 size={18} color={colors.critical} />
        </Pressable>
      ) : null}
    </View>
  );
}
