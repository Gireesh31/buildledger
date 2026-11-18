import { useState } from "react";
import { Text } from "react-native";
import { errorMessage, openWebsite } from "../src/api";
import { useAuth } from "../src/auth";
import { colors } from "../src/theme";
import { Button, Card, Field, Input, Message, Screen } from "../src/ui";

/** Same rule as the website (PASSWORD_MIN_LENGTH); the server checks it too. */
const MIN_PASSWORD = 8;

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (password !== confirm) return setError("Passwords do not match.");
    setPending(true);
    setError(null);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  }

  return (
    <Screen>
      <Card>
        <Text style={{ color: colors.muted }}>Track every rupee on your construction sites.</Text>
        {error ? <Message text={error} /> : null}
        <Field label="Name" required>
          <Input value={name} onChangeText={setName} autoComplete="name" />
        </Field>
        <Field label="Email" required>
          <Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        </Field>
        <Field label="Password" required>
          <Input value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" placeholder={`At least ${MIN_PASSWORD} characters`} />
        </Field>
        <Field label="Confirm password" required>
          <Input value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" />
        </Field>
        <Button label="Create account" busy={pending} disabled={!name || !email || password.length < MIN_PASSWORD || !confirm} onPress={submit} />
        <Text style={{ textAlign: "center", color: colors.muted, fontSize: 13 }}>
          By creating an account you agree to our{" "}
          <Text onPress={() => openWebsite("/privacy")} style={{ color: colors.text, fontWeight: "600", textDecorationLine: "underline" }}>
            privacy policy
          </Text>
          .
        </Text>
      </Card>
    </Screen>
  );
}
