import { useState } from "react";
import { View } from "react-native";
import { featureList, type AppConfig, type FeatureKey } from "@/lib/app-config";
import { api, errorMessage } from "../../src/api";
import { SwitchRow } from "../../src/admin-ui";
import { useAppConfig } from "../../src/config";
import { Text } from "../../src/text";
import { colors } from "../../src/theme";
import { Card, Message, Screen } from "../../src/ui";

/** Switch sections on or off for everyone, on the website and in the app. */
export default function AdminFeatures() {
  const { config, set } = useAppConfig();
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<{ text: string; tone: "error" | "success" } | null>(null);

  async function toggle(key: FeatureKey, on: boolean) {
    setPending(true);
    setNote(null);
    try {
      const saved = await api<AppConfig>("/api/admin/settings", { method: "PUT", body: { features: { ...config.features, [key]: on } } });
      set(saved);
      setNote({ text: `${featureList.find((f) => f.key === key)?.label} is now ${on ? "on" : "off"} for everyone.`, tone: "success" });
    } catch (e) {
      setNote({ text: errorMessage(e), tone: "error" });
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen animate={false}>
      {note ? <Message text={note.text} tone={note.tone} /> : null}
      <Card>
        <View style={{ gap: 18 }}>
          {featureList.map((f) => (
            <SwitchRow key={f.key} label={f.label} hint={f.description} value={config.features[f.key]} disabled={pending} onChange={(on) => toggle(f.key, on)} />
          ))}
        </View>
      </Card>
      <Text style={{ color: colors.muted, fontSize: 13 }}>Turning a section off hides it; nothing already recorded is deleted. Materials and the overview are always on.</Text>
    </Screen>
  );
}
