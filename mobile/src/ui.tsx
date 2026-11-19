import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  type PressableProps,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Text } from "./text";
import { colors, fonts, radius, shadow } from "./theme";

export { Text };

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
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 56, flexGrow: 1 }}
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
    danger: { bg: colors.criticalSoft, fg: colors.critical, border: colors.criticalSoft },
  }[tone];
  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={[
        styles.button,
        small && { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.sm },
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
  const { prefix, style, onFocus, onBlur, ...rest } = props;
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.inputBox, focused && styles.inputFocused]}>
      {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
      <TextInput
        placeholderTextColor={colors.faint}
        selectionColor={colors.brand}
        style={[styles.input, rest.multiline && { minHeight: 88, textAlignVertical: "top" }, style]}
        onFocus={(e) => (setFocused(true), onFocus?.(e))}
        onBlur={(e) => (setFocused(false), onBlur?.(e))}
        {...rest}
      />
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
      style={[styles.chip, selected && { backgroundColor: colors.ink, borderColor: colors.ink }]}
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
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" }}>
      <Text style={{ color: fg, fontSize: 11.5, fontWeight: "600" }}>{label}</Text>
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
      <Text selectable style={{ color: good ? colors.good : colors.critical, fontSize: 14, fontWeight: "500" }}>
        {text}
      </Text>
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

/** Small uppercase label above a heading, like the website's section tags. */
export function Eyebrow({ text, light }: { text: string; light?: boolean }) {
  return <Text style={[styles.eyebrow, light && { color: "#FDBA8C" }]}>{text}</Text>;
}

/** A soft orange light in a dark header corner, like the website hero. */
export function Glow({ top = -40, right = -40 }: { top?: number; right?: number }) {
  // Breathes slowly, like a site light.
  const pulse = useLoop(4200);
  const opacity = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.75, 1, 0.75] });
  const scale = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.92, 1.08, 0.92] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: "absolute", top, right, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(232, 89, 12, 0.3)", boxShadow: "0 0 110px 90px rgba(232, 89, 12, 0.3)", opacity, transform: [{ scale }] }}
    />
  );
}

/** A 0 → 1 value that repeats forever (or stays still when the phone asks for reduced motion). */
export function useLoop(duration: number) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled || reduce) return;
        loop = Animated.loop(Animated.timing(value, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: native }));
        loop.start();
      });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [value, duration]);
  return value;
}

/** The orange-and-black hazard stripe used along the bottom of dark headers. */
export function HazardTape({ height = 6 }: { height?: number }) {
  // Slides one orange-and-black pair (28px) per loop, so it looks like tape moving along the site.
  const slide = useLoop(1600);
  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [-28, 0] });
  return (
    <View style={{ height, overflow: "hidden", backgroundColor: colors.ink }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={{ flexDirection: "row", transform: [{ translateX }] }}>
        {Array.from({ length: 64 }, (_, i) => (
          <View key={i} style={{ width: 14, height: height * 3, marginTop: -height, backgroundColor: i % 2 ? colors.ink : colors.brand, transform: [{ skewX: "-35deg" }] }} />
        ))}
      </Animated.View>
    </View>
  );
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    padding: 18,
    gap: 14,
    boxShadow: shadow.card,
  },
  raised: { boxShadow: shadow.raised },
  cardTitle: { fontSize: 20, fontWeight: "800", color: colors.text, letterSpacing: -0.2 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.md,
    borderCurve: "continuous",
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  buttonText: { fontSize: 15, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "600", color: colors.muted },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.field,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderCurve: "continuous",
  },
  inputFocused: { borderColor: colors.brand, backgroundColor: colors.surface, boxShadow: "0 0 0 3px rgba(232, 89, 12, 0.15)" },
  prefix: { paddingLeft: 14, color: colors.muted, fontSize: 15, fontWeight: "500" },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, fontFamily: fonts.regular },
  chip: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 14, fontWeight: "500", color: colors.text },
  tile: {
    flexGrow: 1,
    flexBasis: "45%",
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    padding: 14,
    gap: 6,
    boxShadow: shadow.card,
  },
  tileLabel: { fontSize: 10.5, color: colors.muted, fontFamily: fonts.mono, letterSpacing: 0.8, textTransform: "uppercase" },
  tileValue: { fontSize: 25, fontWeight: "800", color: colors.text, fontVariant: ["tabular-nums"] },
  tileHint: { fontSize: 12, color: colors.muted },
  empty: { borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border, borderRadius: radius.lg, padding: 24, backgroundColor: "rgba(255,255,255,0.55)" },
  message: { borderRadius: radius.md, borderCurve: "continuous", padding: 12 },
  sectionTitle: { fontSize: 21, fontWeight: "800", color: colors.text, marginTop: 6, letterSpacing: -0.2 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: colors.brand },
});
