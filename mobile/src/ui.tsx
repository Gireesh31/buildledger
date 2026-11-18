import { Children, useEffect, useRef, type ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  type PressableProps,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { colors, radius } from "./theme";

const native = Platform.OS !== "web";

/** Slides up and fades in when it first appears; `delay` staggers a list. */
export function FadeIn({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 380, delay, easing: Easing.out(Easing.cubic), useNativeDriver: native }).start();
  }, [progress, delay]);
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  return <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

/** A pressable that dips slightly while held, so taps feel physical. */
export function PressableScale({
  children,
  style,
  containerStyle,
  ...props
}: Omit<PressableProps, "style"> & { style?: StyleProp<ViewStyle>; /** Layout of the tap area itself (e.g. flex: 1 in a row). */ containerStyle?: StyleProp<ViewStyle>; children: ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) => Animated.spring(scale, { toValue: value, useNativeDriver: native, speed: 40, bounciness: 6 }).start();
  return (
    <Pressable {...props} style={containerStyle} onPressIn={(e) => (to(0.97), props.onPressIn?.(e))} onPressOut={(e) => (to(1), props.onPressOut?.(e))}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** A scrolling page with pull-to-refresh; its sections animate in one after another. */
export function Screen({ children, refreshing, onRefresh, animate = true }: { children: ReactNode; refreshing?: boolean; onRefresh?: () => void; animate?: boolean }) {
  const items = Children.toArray(children);
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 48, flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.brand} colors={[colors.brand]} /> : undefined}
    >
      {animate
        ? items.map((child, i) => (
            <FadeIn key={(child as { key?: string }).key ?? i} delay={Math.min(i, 8) * 55}>
              {child}
            </FadeIn>
          ))
        : children}
    </ScrollView>
  );
}

export function Card({ title, children, style }: { title?: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

type ButtonTone = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  label,
  onPress,
  tone = "primary",
  disabled,
  busy,
  icon,
  small,
}: {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  disabled?: boolean;
  busy?: boolean;
  icon?: ReactNode;
  small?: boolean;
}) {
  const palette = {
    primary: { bg: colors.brand, fg: "#fff", border: colors.brand },
    secondary: { bg: colors.surface, fg: colors.text, border: colors.border },
    ghost: { bg: "transparent", fg: colors.muted, border: "transparent" },
    danger: { bg: colors.surface, fg: colors.critical, border: colors.criticalSoft },
  }[tone];
  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={[
        styles.button,
        small && { paddingVertical: 7, paddingHorizontal: 12 },
        tone === "primary" && styles.raised,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      {busy ? <ActivityIndicator color={palette.fg} size="small" /> : icon}
      <Text style={[styles.buttonText, small && { fontSize: 13 }, { color: palette.fg }]}>{label}</Text>
    </PressableScale>
  );
}

export function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {text}
      {required ? <Text style={{ color: colors.critical }}> *</Text> : null}
    </Text>
  );
}

export function Input(props: TextInputProps & { prefix?: string }) {
  const { prefix, style, ...rest } = props;
  return (
    <View style={styles.inputBox}>
      {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
      <TextInput placeholderTextColor={colors.faint} style={[styles.input, rest.multiline && { minHeight: 80, textAlignVertical: "top" }, style]} {...rest} />
    </View>
  );
}

/** A labelled form row. */
export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Label text={label} required={required} />
      {children}
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: colors.brand, borderColor: colors.brand }]}
    >
      <Text style={[styles.chipText, selected && { color: "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

export function StatTile({ label, value, hint, critical }: { label: string; value: string; hint?: string; critical?: boolean }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, critical && { color: colors.critical }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? <Text style={[styles.tileHint, critical && { color: colors.critical }]}>{hint}</Text> : null}
    </View>
  );
}

/** Two stat tiles per row. */
export function TileGrid({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>{children}</View>;
}

const STATUS = {
  advance: { label: "Paid in advance", bg: colors.infoSoft, fg: colors.info },
  paid: { label: "Paid", bg: colors.goodSoft, fg: colors.good },
  partial: { label: "Part paid", bg: colors.warnSoft, fg: colors.warn },
  due: { label: "Due", bg: colors.criticalSoft, fg: colors.critical },
} as const;

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status as keyof typeof STATUS];
  if (!s) return null;
  return <Badge label={s.label} bg={s.bg} fg={s.fg} />;
}

export function Badge({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" }}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={{ color: colors.muted, textAlign: "center" }}>{text}</Text>
    </View>
  );
}

export function Message({ text, tone = "error" }: { text: string; tone?: "error" | "success" }) {
  const good = tone === "success";
  return (
    <View style={[styles.message, { backgroundColor: good ? colors.goodSoft : colors.criticalSoft }]}>
      <Text style={{ color: good ? colors.good : colors.critical, fontSize: 14 }}>{text}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.brand} size="large" />
    </View>
  );
}

export function SectionTitle({ text }: { text: string }) {
  return <Text style={styles.sectionTitle}>{text}</Text>;
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    shadowColor: "#1C1917",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  raised: { shadowColor: colors.brand, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonText: { fontSize: 15, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "600", color: colors.text },
  inputBox: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  prefix: { paddingLeft: 12, color: colors.muted, fontSize: 15 },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: colors.text },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 14, fontWeight: "500", color: colors.text },
  tile: {
    flexGrow: 1,
    flexBasis: "45%",
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 4,
    shadowColor: "#1C1917",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tileLabel: { fontSize: 12, color: colors.muted },
  tileValue: { fontSize: 19, fontWeight: "700", color: colors.text },
  tileHint: { fontSize: 11, color: colors.muted },
  empty: { borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, borderRadius: radius.md, padding: 20 },
  message: { borderRadius: radius.md, padding: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 6 },
});
