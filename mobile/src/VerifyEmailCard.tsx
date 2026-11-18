import { useState } from "react";
import { Text } from "react-native";
import { api, errorMessage } from "./api";
import { colors } from "./theme";
import { Button, Card, Message } from "./ui";

/** Shown until the email is confirmed: projects shared by invite stay closed until then (same as the website). */
export function VerifyEmailCard({ email }: { email: string }) {
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<{ text: string; tone: "error" | "success" } | null>(null);

  async function resend() {
    setPending(true);
    try {
      const data = await api<{ message: string }>("/api/auth/verify-email/resend", { method: "POST" });
      setNote({ text: data.message, tone: "success" });
    } catch (e) {
      setNote({ text: errorMessage(e), tone: "error" });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card style={{ backgroundColor: colors.warnSoft }}>
      <Text style={{ color: colors.text }}>
        <Text style={{ fontWeight: "700" }}>Confirm your email. </Text>
        Open the link we sent to {email}. Projects others shared with you open once it's confirmed.
      </Text>
      {note ? <Message text={note.text} tone={note.tone} /> : null}
      <Button tone="secondary" small label="Send the link again" busy={pending} onPress={resend} />
    </Card>
  );
}
