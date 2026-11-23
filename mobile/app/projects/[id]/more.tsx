import { router, useNavigation } from "expo-router";
import { BarChart3, ChevronRight, NotebookPen, Receipt, Settings, UserRound, Users } from "lucide-react-native";
import type { ReactNode } from "react";
import { View } from "react-native";
import { useAppConfig } from "../../../src/config";
import { Text } from "../../../src/text";
import { colors } from "../../../src/theme";
import { PressableScale, Screen, SectionTitle, styles } from "../../../src/ui";

/** Everything beyond the four main tabs, as on the website's "More" menu. */
export default function More() {
  // Sibling screens of this project's tabs: switch to them directly.
  const navigation = useNavigation<{ navigate: (screen: string) => void }>();
  const go = (screen: string) => () => navigation.navigate(screen);
  const { features } = useAppConfig().config;
  return (
    <Screen>
      <SectionTitle text="Records" />
      {features.dailyLog && <Row icon={<NotebookPen size={20} color={colors.brand} />} label="Daily log" hint="Work done, weather, notes for each day" onPress={go("daily-log")} />}
      {features.files && <Row icon={<Receipt size={20} color={colors.brand} />} label="Bills & photos" hint="Snap or upload bills, site photos and PDFs" onPress={go("files")} />}
      {features.reports && <Row icon={<BarChart3 size={20} color={colors.brand} />} label="Reports & PDF" hint="Daily, weekly, monthly reports to share" onPress={go("reports")} />}
      <SectionTitle text="Project" />
      {features.team && <Row icon={<Users size={20} color={colors.brand} />} label="Team" hint="Invite people to view or edit this project" onPress={go("team")} />}
      <Row icon={<Settings size={20} color={colors.brand} />} label="Project settings" hint="Name, budget, dates, status, delete" onPress={go("settings")} />
      <Row icon={<UserRound size={20} color={colors.brand} />} label="Your profile" hint="Your name, phone, password, sign out" onPress={() => router.push("/profile")} />
    </Screen>
  );
}

function Row({ icon, label, hint, onPress }: { icon: ReactNode; label: string; hint: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 }]}>
      <View style={{ backgroundColor: colors.brandSoft, borderRadius: 12, padding: 10 }}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{label}</Text>
        <Text style={{ fontSize: 12, color: colors.muted }}>{hint}</Text>
      </View>
      <ChevronRight size={18} color={colors.faint} />
    </PressableScale>
  );
}
