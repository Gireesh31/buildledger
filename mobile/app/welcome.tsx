import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { View } from "react-native";
import { Text } from "../src/text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, errorMessage } from "../src/api";
import { afterWelcome, useAuth } from "../src/auth";
import { colors } from "../src/theme";
import { Button, Card, FadeIn, Message, Screen } from "../src/ui";

const nextSteps = [
  { title: "Add your site", body: "Project name, location and type of construction." },
  { title: "Set budget and timeline", body: "Total budget, built-up area and dates, so you can track cost per sq ft." },
  { title: "Invite your team", body: "Engineers, supervisors or partners as editors or viewers." },
];

/** The website's onboarding welcome: shown once, until the person starts their first project or skips. */
export default function Welcome() {
  const { user, refresh } = useAuth();
  const [pending, setPending] = useState<"start" | "skip" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  async function finish(kind: "start" | "skip") {
    setPending(kind);
    setError(null);
    try {
      await api("/api/onboarding/complete", { method: "POST" });
      // Marking onboarding done swaps this screen for the home screen, which then opens "New project"
      // on top of itself (so it has a back arrow).
      afterWelcome.route = kind === "start" ? "/projects/new" : null;
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
      setPending(null);
    }
  }

  return (
    <Screen>
      {/* No header here, so keep clear of the status bar and use dark icons on the light page. */}
      <StatusBar style="dark" />
      <View style={{ height: insets.top }} />
      <FadeIn>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text }}>Welcome, {user?.firstName || user?.name.split(" ")[0]} 👋</Text>
        <Text style={{ color: colors.muted, marginTop: 6, lineHeight: 21 }}>
          BuildLedger tracks materials, labour, transport and daily progress for your construction sites. Let's set up your first project. It takes about a minute.
        </Text>
      </FadeIn>
      {error ? <Message text={error} /> : null}
      {nextSteps.map((step, index) => (
        <FadeIn key={step.title} delay={80 * (index + 1)}>
          <Card style={{ flexDirection: "row", gap: 12, backgroundColor: colors.brandSoft }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: colors.text }}>{step.title}</Text>
              <Text style={{ color: colors.muted, marginTop: 2 }}>{step.body}</Text>
            </View>
          </Card>
        </FadeIn>
      ))}
      <Button label="Get started" busy={pending === "start"} disabled={pending !== null} onPress={() => finish("start")} />
      <Button tone="secondary" label="Skip for now" busy={pending === "skip"} disabled={pending !== null} onPress={() => finish("skip")} />
    </Screen>
  );
}
