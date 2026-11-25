import { Link } from "expo-router";
import { HardHat } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Text } from "../src/text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { errorMessage, openWebsite } from "../src/api";
import { useAuth } from "../src/auth";
import { colors, fonts } from "../src/theme";
import { ConstructionScene } from "../src/construction-scene";
import { Button, Card, FadeIn, Field, Glow, HazardTape, Input, Message } from "../src/ui";

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

  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Dark site-board band behind the top half, edged with hazard tape. */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: "46%", backgroundColor: colors.ink, overflow: "hidden" }}>
        <Glow top={-30} right={-30} />
        <ConstructionScene size={0.75} style={{ position: "absolute", right: 10, top: 34, opacity: 0.8 }} />
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
          <HazardTape />
        </View>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20, gap: 22 }} keyboardShouldPersistTaps="handled">
          <FadeIn>
            <Brand light />
            <Text style={{ textAlign: "center", color: "rgba(255,255,255,0.72)", marginTop: 10 }}>Track every rupee on your construction sites.</Text>
          </FadeIn>
          <FadeIn delay={120}>
          <Card style={{ boxShadow: "0 2px 4px rgba(22,22,26,0.06), 0 24px 48px -20px rgba(22,22,26,0.35)", padding: 22 }}>
            <Text style={{ fontSize: 32, fontWeight: "800", color: colors.text }}>Sign in</Text>
            <Text style={{ color: colors.muted }}>Welcome back. Sign in to your account.</Text>
            {error ? <Message text={error} /> : null}
            <Field label="Email">
              <Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
            </Field>
            <Field label="Password">
              <Input value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" onSubmitEditing={submit} />
            </Field>
            <Link href="/forgot-password" style={{ alignSelf: "flex-end", color: colors.brand, fontFamily: fonts.semibold }}>
              Forgot password?
            </Link>
            <Button label="Sign in" busy={pending} disabled={!email || !password} onPress={submit} />
            <Text style={{ textAlign: "center", color: colors.muted }}>
              No account?{" "}
              <Link href="/register" style={{ color: colors.brand, fontFamily: fonts.bold }}>
                Create one
              </Link>
            </Text>
          </Card>
          </FadeIn>
          <Text onPress={() => openWebsite("/privacy")} style={{ textAlign: "center", color: colors.muted, textDecorationLine: "underline" }}>
            Privacy policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function Brand({ light }: { light?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <View style={{ backgroundColor: colors.brand, borderRadius: 14, borderCurve: "continuous", padding: 10 }}>
        <HardHat size={28} color="#fff" />
      </View>
      <Text style={{ fontSize: 34, fontWeight: "800", color: light ? "#fff" : colors.text }}>
        Build<Text style={{ color: colors.brassLight, fontWeight: "800" }}>Ledger</Text>
      </Text>
    </View>
  );
}
