import { router, Stack, useLocalSearchParams } from "expo-router";
import { Save, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import type { User } from "@/lib/types";
import { api, errorMessage } from "../../../src/api";
import { confirmAction, SwitchRow } from "../../../src/admin-ui";
import { useAuth } from "../../../src/auth";
import { useLoad } from "../../../src/data";
import { Text } from "../../../src/text";
import { colors } from "../../../src/theme";
import { Button, Card, Field, Input, Loading, Message, Screen } from "../../../src/ui";

/** One account: edit the profile, verify the email, disable it, make it an admin or delete it. */
export default function AdminUser() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: me } = useAuth();
  const { data, error, reload } = useLoad(() => api<{ user: User; ownedProjects: number }>(`/api/admin/users/${id}`), `admin-user-${id}`);
  const [values, setValues] = useState({ firstName: "", lastName: "", email: "", phone: "", location: "" });
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [note, setNote] = useState<{ text: string; tone: "error" | "success" } | null>(null);

  const user = data?.user;
  useEffect(() => {
    if (user) setValues({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone ?? "", location: user.location ?? "" });
  }, [user]);

  if (!data) return error ? <Screen><Message text={error} /></Screen> : <Loading />;
  const target = data.user;
  const self = target.id === me?.id;
  const set = (key: keyof typeof values) => (value: string) => setValues((v) => ({ ...v, [key]: value }));

  async function save(changes: Record<string, unknown>, done: string) {
    setPending(true);
    setNote(null);
    try {
      await api(`/api/admin/users/${target.id}`, { method: "PATCH", body: changes });
      await reload();
      setNote({ text: done, tone: "success" });
    } catch (e) {
      setNote({ text: errorMessage(e), tone: "error" });
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setPending(true);
    try {
      await api(`/api/admin/users/${target.id}`, { method: "DELETE", body: { confirm } });
      router.back();
    } catch (e) {
      setNote({ text: errorMessage(e), tone: "error" });
      setPending(false);
    }
  }

  return (
    <Screen animate={false}>
      <Stack.Screen options={{ title: target.name }} />
      {note ? <Message text={note.text} tone={note.tone} /> : null}

      <Card title="Profile">
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="First name" required>
              <Input value={values.firstName} onChangeText={set("firstName")} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Last name">
              <Input value={values.lastName} onChangeText={set("lastName")} />
            </Field>
          </View>
        </View>
        <Field label="Email" required>
          <Input value={values.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        </Field>
        <Field label="Phone">
          <Input value={values.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
        </Field>
        <Field label="Location">
          <Input value={values.location} onChangeText={set("location")} />
        </Field>
        <Button label="Save profile" icon={<Save size={17} color="#fff" />} busy={pending} onPress={() => save(values, "Profile saved. It shows on the website and in the app.")} />
      </Card>

      <Card title="Access">
        <View style={{ gap: 16 }}>
          <SwitchRow
            label="Email verified"
            hint="Verified people can open projects shared with their email."
            value={Boolean(target.emailVerifiedAt)}
            disabled={pending}
            onChange={(verified) => save({ verified }, verified ? "Email marked verified." : "Email marked unverified.")}
          />
          <SwitchRow
            label="Admin"
            hint={self ? "You can't remove your own admin access." : "Admins can open this panel and every project."}
            value={Boolean(target.isAdmin)}
            disabled={pending || self}
            onChange={(isAdmin) => save({ isAdmin }, isAdmin ? `${target.name} is now an admin.` : `${target.name} is no longer an admin.`)}
          />
          <SwitchRow
            label="Disabled"
            hint={self ? "You can't disable your own account." : "Signs them out everywhere and blocks sign-in."}
            value={Boolean(target.disabledAt)}
            disabled={pending || self}
            onChange={(disabled) => save({ disabled }, disabled ? "Account disabled and signed out everywhere." : "Account enabled again.")}
          />
        </View>
      </Card>


      {!self ? (
        <Card title="Delete account">
          <Text style={{ color: colors.muted }}>Deletes the account and the {data.ownedProjects === 1 ? "project" : `${data.ownedProjects} projects`} it owns, with all entries, bills and photos. This can't be undone.</Text>
          <Field label="Type DELETE to confirm" required>
            <Input value={confirm} onChangeText={setConfirm} autoCapitalize="characters" autoCorrect={false} />
          </Field>
          <Button
            tone="danger"
            label="Delete account"
            icon={<Trash2 size={17} color={colors.critical} />}
            busy={pending}
            disabled={confirm !== "DELETE"}
            onPress={() => confirmAction(`Delete ${target.name}?`, "Their account and the projects they own are deleted for good.", "Delete", remove)}
          />
        </Card>
      ) : null}
    </Screen>
  );
}
