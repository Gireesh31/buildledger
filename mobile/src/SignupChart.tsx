import { useRef, useState } from "react";
import { Pressable, ScrollView, View, type ScrollViewInstance } from "react-native";
import { signupPointTitle, type SignupSeries } from "@/lib/signups";
import { Text } from "./text";
import { colors, fonts } from "./theme";
import { Chip, styles } from "./ui";

type Range = "daily" | "monthly";
type Metric = "count" | "total";

const SERIES = "#2A78D6";
const HEIGHT = 170;

function niceTop(max: number) {
  if (max <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  return [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= max)! * magnitude;
}

/** Users over time, the same graph as the website's admin overview. Tap a bar for its date and numbers. */
export function SignupChart({ series }: { series: SignupSeries }) {
  const [range, setRange] = useState<Range>("daily");
  const [metric, setMetric] = useState<Metric>("count");
  const data = series[range];
  const [picked, setPicked] = useState<string | null>(null);
  const scroller = useRef<ScrollViewInstance>(null);
  const point = data.find((d) => d.key === picked) ?? data[data.length - 1];
  const top = niceTop(Math.max(...data.map((d) => d[metric]), 0));
  const barWidth = range === "daily" ? 10 : 20;
  const gap = range === "daily" ? 3 : 8;
  const showLabel = (i: number) => (range === "monthly" ? true : i === data.length - 1 || (data.length - 1 - i) % 5 === 0);
  const periodNew = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <View style={[styles.card, { gap: 12 }]}>
      <View>
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Users over time</Text>
        <Text style={{ fontSize: 12.5, color: colors.muted }}>
          {periodNew} new in the {range === "daily" ? "last 30 days" : "last 12 months"} · {data[data.length - 1]?.total ?? 0} in all
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Chip label="New sign-ups" selected={metric === "count"} onPress={() => setMetric("count")} />
        <Chip label="Total users" selected={metric === "total"} onPress={() => setMetric("total")} />
        <Chip label="30 days" selected={range === "daily"} onPress={() => (setRange("daily"), setPicked(null))} />
        <Chip label="12 months" selected={range === "monthly"} onPress={() => (setRange("monthly"), setPicked(null))} />
      </View>

      {/* The tapped (or latest) bar's numbers. */}
      <View style={{ backgroundColor: colors.field, borderRadius: 10, padding: 10, flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontWeight: "600", color: colors.text }}>{signupPointTitle(point)}</Text>
        <Text style={{ color: colors.muted }}>
          <Text style={{ fontWeight: "700", color: colors.text }}>{point.count}</Text> new · <Text style={{ fontWeight: "700", color: colors.text }}>{point.total}</Text> in all
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 6 }}>
        {/* Y axis */}
        <View style={{ width: 22, height: HEIGHT }}>
          {[0, 0.5, 1].map((f) => (
            <Text key={f} style={{ position: "absolute", right: 0, bottom: f * HEIGHT - 7, fontSize: 10, color: colors.faint, fontFamily: fonts.mono }}>
              {Number.isInteger(f * top) ? f * top : ""}
            </Text>
          ))}
        </View>
        {/* Opens on the latest days; older ones are a swipe to the left. */}
        <ScrollView
          ref={scroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 4 }}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}
        >
          <View>
            <View style={{ height: HEIGHT, flexDirection: "row", alignItems: "flex-end", gap, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              {[0.5, 1].map((f) => (
                <View key={f} style={{ position: "absolute", left: 0, right: 0, bottom: f * HEIGHT, height: 1, backgroundColor: colors.border, opacity: 0.6 }} />
              ))}
              {data.map((d) => {
                const value = d[metric];
                const selected = d.key === point.key;
                return (
                  <Pressable
                    key={d.key}
                    onPress={() => setPicked(d.key)}
                    accessibilityLabel={`${signupPointTitle(d)}: ${d.count} new, ${d.total} in all`}
                    hitSlop={{ top: 10, bottom: 10, left: gap / 2, right: gap / 2 }}
                    style={{ height: HEIGHT, justifyContent: "flex-end" }}
                  >
                    <View
                      style={{
                        width: barWidth,
                        height: Math.max((value / top) * HEIGHT, value > 0 ? 3 : 0),
                        backgroundColor: SERIES,
                        opacity: selected ? 1 : 0.75,
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                      }}
                    />
                  </Pressable>
                );
              })}
            </View>
            {/* Dates along the bottom. */}
            <View style={{ flexDirection: "row", gap, marginTop: 4 }}>
              {data.map((d, i) => (
                <View key={d.key} style={{ width: barWidth, alignItems: "center", overflow: "visible" }}>
                  {showLabel(i) ? (
                    <Text numberOfLines={1} style={{ fontSize: 9.5, color: colors.muted, width: 44, textAlign: "center" }}>
                      {d.label}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
