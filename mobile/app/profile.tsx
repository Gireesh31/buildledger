import { LogOut, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { formatDate } from "@/lib/format";
import { api, errorMessage, openWebsite } from "../src/api";
import { useAuth } from "../src/auth";
import { colors } from "../src/theme";
import { Button, Card, Field, Input, Message, Screen } from "../src/ui";

/** Your details, password and sign out: the website's Profile page. */
export default function Profile() {
  const { user, signOut, refresh, forget } = useAuth();
  const [values, setValues] = useState({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", phone: user?.phone ?? "", location: user?.location ?? "", email: user?.email ?? "" });
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<"details" | "password" | "delete" | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [note, setNote] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  if (!user) return null;
  const set = (name: keyof typeof values) => (value: string) => setValues((v) => ({ ...v, [name]: value }));
  const emailChanged = values.email.trim().toLowerCase() !== user.email.toLowerCase();

  async function save(kind: "details" | "password") {
    setPending(kind);
    setNote(null);
    try {
      await api("/api/account", {
        method: "PUT",
        body: { ...values, ...(kind === "password" ? { password } : {}), ...(currentPassword ? { currentPassword } : {}) },
      });
      await refresh();
      setPassword("");
      setCurrentPassword("");
      setNote({ text: kind === "password" ? "Password changed." : "Profile saved.", tone: "success" });
    } catch (e) {
      setNote({ text: errorMessage(e), tone: "error" });
    } finally {
      setPending(null);
    }
  }

  /** The website's "Delete account": removes the account and every project the person owns. */
  async function deleteAccount() {
    setPending("delete");
    setNote(null);
    try {
      await api("/api/account", { method: "DELETE", body: { password: deletePassword, confirm: deleteConfirm } });
      await forget();
    } catch (e) {
      setNote({ text: errorMessage(e), tone: "error" });
      setPending(null);
    }
  }
  const askDelete = () => {
    const message = "This deletes your account and every project you own, with all their entries, bills and photos. It can't be undone.";
    if (Platform.OS === "web") return void (globalThis.confirm?.(message) && deleteAccount());
    Alert.alert("Delete your account?", message, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteAccount }]);
  };

  return (
    <Screen>
      <View style={{ alignItems: "center", gap: 6, paddingVertical: 8 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800" }}>{(user.firstName || user.name || "?").charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>{user.name}</Text>
        <Text style={{ color: colors.muted }}>Member since {formatDate(user.createdAt)}</Text>
      </View>
      {note ? <Message text={note.text} tone={note.tone} /> : null}

      <Card title="Your details">
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
        <Field label="Phone">
          <Input value={values.phone} onChangeText={set("phone")} keyboardType="phone-pad" placeholder="98765 43210" />
        </Field>
        <Field label="Location">
          <Input value={values.location} onChangeText={set("location")} placeholder="e.g. Tumakuru" />
        </Field>
        <Field label="Email" required>
          <Input value={values.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        </Field>
        {emailChanged ? (
          <Field label="Current password (needed to change email)" required>
            <Input value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
          </Field>
        ) : null}
        <Button label="Save profile" busy={pending === "details"} disabled={!values.firstName.trim()} onPress={() => save("details")} />
      </Card>

      <Card title="Change password">
        <Field label="Current password">
          <Input value={emailChanged ? "" : currentPassword} onChangeText={setCurrentPassword} secureTextEntry editable={!emailChanged} />
        </Field>
        <Field label="New password">
          <Input value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 8 characters" />
        </Field>
        <Button tone="secondary" label="Change password" busy={pending === "password"} disabled={!password || !currentPassword} onPress={() => save("password")} />
      </Card>

      <Card title="About">
        <Button tone="ghost" label="Privacy policy" onPress={() => openWebsite("/privacy")} />
        <Button tone="ghost" label="Photo credits" onPress={() => openWebsite("/credits")} />
      </Card>

      <Button tone="danger" label="Sign out" icon={<LogOut size={17} color={colors.critical} />} onPress={signOut} />

      <Card title="Delete account">
        <Text style={{ color: colors.muted }}>Deletes your account and every project you own, with all their entries, bills and photos. Projects shared with you stay with their owners.</Text>
        <Field label="Password" required>
          <Input value={deletePassword} onChangeText={setDeletePassword} secureTextEntry autoComplete="current-password" />
        </Field>
        <Field label="Type DELETE to confirm" required>
          <Input value={deleteConfirm} onChangeText={setDeleteConfirm} autoCapitalize="characters" autoCorrect={false} />
        </Field>
        <Button tone="danger" label="Delete account" icon={<Trash2 size={17} color={colors.critical} />} busy={pending === "delete"} disabled={!deletePassword || deleteConfirm !== "DELETE"} onPress={askDelete} />
      </Card>
    </Screen>
  );
}
