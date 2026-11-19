import { useState } from "react";
import { Text } from "../src/text";
import { api, errorMessage } from "../src/api";
import { colors } from "../src/theme";
import { Button, Card, Field, Input, Message, Screen } from "../src/ui";

/** The website's "Forgot password" page. The reset link opens the website, where the new password is set. */
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<{ text: string; tone: "error" | "success" } | null>(null);

  async function submit() {
    setPending(true);
    setNote(null);
    try {
      const data = await api<{ message: string }>("/api/auth/forgot-password", { body: { email: email.trim() } });
      setNote({ text: data.message, tone: "success" });
    } catch (e) {
      setNote({ text: errorMessage(e), tone: "error" });
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen>
      <Card>
        <Text style={{ color: colors.muted }}>Enter the email you signed up with and we'll send you a link to set a new password.</Text>
        {note ? <Message text={note.text} tone={note.tone} /> : null}
        <Field label="Email" required>
          <Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" onSubmitEditing={submit} />
        </Field>
        <Button label="Send reset link" busy={pending} disabled={!email.trim()} onPress={submit} />
      </Card>
    </Screen>
  );
}
