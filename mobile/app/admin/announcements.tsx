import { Pencil, Plus, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { announcementKinds, type Announcement, type AnnouncementKind } from "@/lib/app-config";
import { api, errorMessage } from "../../src/api";
import { confirmAction, SwitchRow } from "../../src/admin-ui";
import { useLoad } from "../../src/data";
import { DateInput } from "../../src/inputs";
import { Text } from "../../src/text";
import { colors } from "../../src/theme";
import { Badge, Button, Card, Chip, Empty, Field, Input, Loading, Message, Screen } from "../../src/ui";

interface Draft {
  kind: AnnouncementKind;
  title: string;
  body: string;
  linkUrl: string;
  linkLabel: string;
  startsAt: string;
  endsAt: string;
  published: boolean;
}

const empty: Draft = { kind: "news", title: "", body: "", linkUrl: "", linkLabel: "", startsAt: "", endsAt: "", published: true };

const toDay = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fromDay = (day: string, end: boolean) => (day ? new Date(`${day}T${end ? "23:59:59" : "00:00:00"}`).toISOString() : "");

function statusOf(a: Announcement): string {
  const now = Date.now();
  if (!a.published) return "Draft";
  if (a.startsAt && Date.parse(a.startsAt) > now) return "Scheduled";
  if (a.endsAt && Date.parse(a.endsAt) <= now) return "Ended";
  return "Live";
}

/** News, new features and offers shown on the website dashboard and the app's home screen. */
export default function AdminAnnouncements() {
  const { data, error, reload, refreshing, onRefresh } = useLoad(() => api<Announcement[]>("/api/admin/announcements"), "admin-announcements");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  if (!data && !error) return <Loading />;
  const set = <K extends keyof Draft>(key: K) => (value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  function open(a: Announcement | "new") {
    setNote(null);
    setEditing(a === "new" ? "new" : a.id);
    setDraft(
      a === "new"
        ? empty
        : { kind: a.kind, title: a.title, body: a.body, linkUrl: a.linkUrl ?? "", linkLabel: a.linkLabel ?? "", startsAt: toDay(a.startsAt), endsAt: toDay(a.endsAt), published: a.published },
    );
  }

  async function save() {
    setPending(true);
    setNote(null);
    try {
      const body = { ...draft, startsAt: fromDay(draft.startsAt, false), endsAt: fromDay(draft.endsAt, true) };
      if (editing === "new") await api("/api/admin/announcements", { method: "POST", body });
      else await api(`/api/admin/announcements/${editing}`, { method: "PUT", body });
      setEditing(null);
      await reload();
      setNote({ text: draft.published ? "Saved. People see it on the website and in the app." : "Saved as a draft.", tone: "success" });
    } catch (e) {
      setNote({ text: errorMessage(e), tone: "error" });
    } finally {
      setPending(false);
    }
  }

  async function remove(a: Announcement) {
    setPending(true);
    try {
      await api(`/api/admin/announcements/${a.id}`, { method: "DELETE" });
      if (editing === a.id) setEditing(null);
      await reload();
    } catch (e) {
      setNote({ text: errorMessage(e), tone: "error" });
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh} animate={false}>
      {error ? <Message text={error} /> : null}
      {note ? <Message text={note.text} tone={note.tone} /> : null}
      {!editing ? <Button label="New announcement" icon={<Plus size={17} color="#fff" />} onPress={() => open("new")} /> : null}

      {editing ? (
        <Card title={editing === "new" ? "New announcement" : "Edit announcement"}>
          <Field label="Type" required>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {announcementKinds.map((k) => (
                <Chip key={k.value} label={k.label} selected={draft.kind === k.value} onPress={() => set("kind")(k.value)} />
              ))}
            </View>
          </Field>
          <Field label="Title" required>
            <Input value={draft.title} onChangeText={set("title")} maxLength={120} placeholder="e.g. 10% off yearly plans this Diwali" />
          </Field>
          <Field label="Message">
            <Input value={draft.body} onChangeText={set("body")} maxLength={1000} multiline />
          </Field>
          <Field label="Link (optional)">
            <Input value={draft.linkUrl} onChangeText={set("linkUrl")} autoCapitalize="none" autoCorrect={false} placeholder="https://… or /projects/new" />
          </Field>
          <Field label="Button text">
            <Input value={draft.linkLabel} onChangeText={set("linkLabel")} maxLength={40} placeholder="Learn more" />
          </Field>
          <Field label="Show from (optional)">
            <DateInput value={draft.startsAt} onChange={set("startsAt")} />
            {draft.startsAt ? <Button small tone="ghost" label="Clear" onPress={() => set("startsAt")("")} /> : null}
          </Field>
          <Field label="Show until (optional)">
            <DateInput value={draft.endsAt} onChange={set("endsAt")} />
            {draft.endsAt ? <Button small tone="ghost" label="Clear" onPress={() => set("endsAt")("")} /> : null}
          </Field>
          <SwitchRow label="Published" hint="Off keeps it as a draft." value={draft.published} onChange={set("published")} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button label="Save" busy={pending} disabled={!draft.title.trim()} onPress={save} />
            </View>
            <View style={{ flex: 1 }}>
              <Button tone="secondary" label="Cancel" onPress={() => setEditing(null)} />
            </View>
          </View>
        </Card>
      ) : null}

      {data && data.length === 0 ? <Empty text="No announcements yet." /> : null}
      {(data ?? []).map((a) => (
        <Card key={a.id}>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Badge label={announcementKinds.find((k) => k.value === a.kind)?.label ?? a.kind} bg={colors.brandSoft} fg={colors.brandStrong} />
            <Badge label={statusOf(a)} bg={colors.field} fg={colors.muted} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{a.title}</Text>
          {a.body ? (
            <Text style={{ color: colors.muted }} numberOfLines={3}>
              {a.body}
            </Text>
          ) : null}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button small tone="secondary" label="Edit" icon={<Pencil size={14} color={colors.text} />} onPress={() => open(a)} />
            <Button
              small
              tone="danger"
              label="Delete"
              icon={<Trash2 size={14} color={colors.critical} />}
              disabled={pending}
              onPress={() => confirmAction(`Delete “${a.title}”?`, "It disappears from the website and the app.", "Delete", () => remove(a))}
            />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
