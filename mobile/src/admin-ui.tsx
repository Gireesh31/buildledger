import { ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import { Alert, Platform, Switch, View } from "react-native";
import { Text } from "./text";
import { colors } from "./theme";
import { PressableScale, styles } from "./ui";

/** A tappable card row: icon, title, a line of detail and a chevron. */
export function NavRow({ icon, label, hint, onPress, right }: { icon?: ReactNode; label: string; hint?: string; onPress: () => void; right?: ReactNode }) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 }]}>
      {icon ? <View style={{ backgroundColor: colors.brandSoft, borderRadius: 12, padding: 10 }}>{icon}</View> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }} numberOfLines={1}>
          {label}
        </Text>
        {hint ? (
          <Text style={{ fontSize: 12.5, color: colors.muted }} numberOfLines={2}>
            {hint}
          </Text>
        ) : null}
      </View>
      {right}
      <ChevronRight size={18} color={colors.faint} />
    </PressableScale>
  );
}

/** A labelled on/off switch with a line of explanation. */
export function SwitchRow({ label, hint, value, disabled, onChange }: { label: string; hint?: string; value: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, opacity: disabled ? 0.55 : 1 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{label}</Text>
        {hint ? <Text style={{ fontSize: 12.5, color: colors.muted }}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ true: colors.brand, false: colors.border }}
        thumbColor="#fff"
        accessibilityLabel={label}
      />
    </View>
  );
}

/** Asks before a destructive step (a browser confirm in the web preview). */
export function confirmAction(title: string, message: string, action: string, onYes: () => void) {
  if (Platform.OS === "web") return void (globalThis.confirm?.(`${title}\n\n${message}`) && onYes());
  Alert.alert(title, message, [{ text: "Cancel", style: "cancel" }, { text: action, style: "destructive", onPress: onYes }]);
}
