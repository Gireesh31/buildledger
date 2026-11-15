import { Link } from "expo-router";
import { HardHat } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { errorMessage } from "../src/api";
import { useAuth } from "../src/auth";
import { colors } from "../src/theme";
import { Button, Card, Field, Input, Message } from "../src/ui";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
          <Brand />
          <Card>
            <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text }}>Sign in</Text>
            <Text style={{ color: colors.muted }}>Welcome back. Sign in to your account.</Text>
            {error ? <Message text={error} /> : null}
            <Field label="Email">
              <Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
            </Field>
            <Field label="Password">
              <Input value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" onSubmitEditing={submit} />
            </Field>
            <Button label="Sign in" busy={pending} disabled={!email || !password} onPress={submit} />
            <Text style={{ textAlign: "center", color: colors.muted }}>
              No account?{" "}
              <Link href="/register" style={{ color: colors.text, fontWeight: "700" }}>
                Create one
              </Link>
            </Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Brand() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <View style={{ backgroundColor: colors.brand, borderRadius: 12, padding: 9 }}>
        <HardHat size={24} color="#fff" />
      </View>
      <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text }}>
        Build<Text style={{ color: colors.brand }}>Ledger</Text>
      </Text>
    </View>
  );
}
