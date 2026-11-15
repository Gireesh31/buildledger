import { router, useLocalSearchParams } from "expo-router";
import { BarChart3, ChevronRight, ExternalLink, NotebookPen, Receipt, Settings, UserRound, Users } from "lucide-react-native";
import type { ReactNode } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { API_URL } from "../../../src/api";
import { colors, radius } from "../../../src/theme";
import { Screen, SectionTitle } from "../../../src/ui";

/** Everything beyond the four main tabs, as on the website's "More" menu. */
export default function More() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const web = (path: string) => () => Linking.openURL(`${API_URL}/projects/${id}${path}`);
  return (
    <Screen>
      <Row icon={<NotebookPen size={20} color={colors.brand} />} label="Daily log" onPress={() => router.push(`/projects/${id}/daily-log`)} />
      <Row icon={<BarChart3 size={20} color={colors.brand} />} label="Reports & PDF" onPress={() => router.push(`/projects/${id}/reports`)} />
      <Row icon={<UserRound size={20} color={colors.brand} />} label="Your profile" onPress={() => router.push("/profile")} />
      <SectionTitle text="On the website" />
      <Row icon={<Receipt size={20} color={colors.muted} />} label="Bills & photos" onPress={web("/files")} external />
      <Row icon={<Users size={20} color={colors.muted} />} label="Team" onPress={web("/team")} external />
      <Row icon={<Settings size={20} color={colors.muted} />} label="Project settings" onPress={web("/settings")} external />
    </Screen>
  );
}

function Row({ icon, label, onPress, external }: { icon: ReactNode; label: string; onPress: () => void; external?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {icon}
      <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.text }}>{label}</Text>
      <View>{external ? <ExternalLink size={16} color={colors.faint} /> : <ChevronRight size={18} color={colors.faint} />}</View>
    </Pressable>
  );
}
