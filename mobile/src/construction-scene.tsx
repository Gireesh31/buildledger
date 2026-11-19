import { Animated, View } from "react-native";
import { colors } from "./theme";
import { useLoop } from "./ui";

const steel = "rgba(255, 255, 255, 0.16)";
const window = "rgba(253, 186, 140, 0.55)";

/**
 * A small building site that lives along the bottom of the dark headers: a tower crane whose
 * trolley runs along the jib while the hook lowers and lifts a load, a building rising floor by
 * floor, and a blinking warning light. Purely decorative, and still when Reduce Motion is on.
 * `size` scales the whole scene (1 = 120px tall).
 */
export function ConstructionScene({ size = 1, style }: { size?: number; style?: object }) {
  const u = (n: number) => n * size;
  const travel = useLoop(7000); // trolley along the jib and back
  const lift = useLoop(3500); // hook down and up
  const rise = useLoop(9000); // the building grows, then starts again
  const blink = useLoop(1400);

  const trolleyX = travel.interpolate({ inputRange: [0, 0.5, 1], outputRange: [u(18), u(108), u(18)] });
  // Native-driven animations can't change height, so the cable stretches (scaleY from its top)
  // and the hook rides down with translateY.
  const drop = lift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [u(14), u(46), u(14)] });
  const cableScale = lift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [14 / 46, 1, 14 / 46] });
  const floors = rise.interpolate({ inputRange: [0, 0.85, 1], outputRange: [0.15, 1, 1] });
  const light = blink.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [1, 1, 0.15, 0.15] });

  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ width: u(190), height: u(120) }, style]}>
      {/* Finished buildings behind. */}
      <Building left={u(0)} width={u(34)} height={u(58)} u={u} />
      <Building left={u(150)} width={u(40)} height={u(74)} u={u} />

      {/* The building going up: its floors grow from the ground. */}
      <View style={{ position: "absolute", left: u(52), bottom: 0, width: u(58), height: u(86), justifyContent: "flex-end" }}>
        <Animated.View style={{ height: "100%", transform: [{ translateY: u(43) }, { scaleY: floors }, { translateY: -u(43) }] }}>
          <View style={{ flex: 1, backgroundColor: steel, borderTopWidth: u(2), borderColor: colors.brand, gap: u(5), padding: u(5) }}>
            {Array.from({ length: 6 }, (_, i) => (
              <View key={i} style={{ flexDirection: "row", gap: u(5) }}>
                {Array.from({ length: 4 }, (_, j) => (
                  <View key={j} style={{ flex: 1, height: u(6), backgroundColor: (i + j) % 3 ? window : "rgba(255,255,255,0.08)" }} />
                ))}
              </View>
            ))}
          </View>
        </Animated.View>
        {/* Scaffold poles on each side. */}
        <View style={{ position: "absolute", left: -u(4), bottom: 0, width: u(2), height: "100%", backgroundColor: "rgba(255,255,255,0.25)" }} />
        <View style={{ position: "absolute", right: -u(4), bottom: 0, width: u(2), height: "100%", backgroundColor: "rgba(255,255,255,0.25)" }} />
      </View>

      {/* Tower crane: mast, jib, counter-jib with weight, cab. */}
      <View style={{ position: "absolute", left: u(124), bottom: 0, width: u(6), height: u(108), backgroundColor: colors.brand, opacity: 0.9 }}>
        {Array.from({ length: 9 }, (_, i) => (
          <View key={i} style={{ position: "absolute", top: u(4 + i * 12), left: 0, width: u(6), height: u(1.5), backgroundColor: colors.ink }} />
        ))}
      </View>
      <View style={{ position: "absolute", left: u(6), top: u(10), width: u(160), height: u(4), backgroundColor: colors.brand }} />
      <View style={{ position: "absolute", left: u(138), top: u(14), width: u(16), height: u(9), backgroundColor: "rgba(255,255,255,0.35)" }} />
      <View style={{ position: "absolute", left: u(120), top: u(14), width: u(14), height: u(10), borderRadius: u(2), backgroundColor: colors.brand }} />
      <View style={{ position: "absolute", left: u(126), top: u(2), width: u(2), height: u(8), backgroundColor: colors.brand }} />
      <Animated.View style={{ position: "absolute", left: u(124), top: -u(1), width: u(5), height: u(5), borderRadius: u(3), backgroundColor: "#FF3B30", opacity: light }} />

      {/* Trolley, cable and hook with its load. */}
      <Animated.View style={{ position: "absolute", top: u(13), left: 0, transform: [{ translateX: trolleyX }] }}>
        <View style={{ width: u(10), height: u(4), backgroundColor: "#fff", opacity: 0.85 }} />
        <Animated.View style={{ marginLeft: u(4.5), width: u(1), height: u(46), backgroundColor: "rgba(255,255,255,0.7)", transformOrigin: "top", transform: [{ scaleY: cableScale }] }} />
        <Animated.View style={{ position: "absolute", top: u(4), left: 0, transform: [{ translateY: drop }] }}>
          <View style={{ marginLeft: u(1), width: u(8), height: u(3), backgroundColor: "#fff", opacity: 0.85 }} />
          <View style={{ marginLeft: -u(3), marginTop: u(1), width: u(16), height: u(7), backgroundColor: "#FDBA8C", borderRadius: u(1) }} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function Building({ left, width, height, u }: { left: number; width: number; height: number; u: (n: number) => number }) {
  return (
    <View style={{ position: "absolute", left, bottom: 0, width, height, backgroundColor: "rgba(255,255,255,0.07)", padding: u(4), gap: u(5) }}>
      {Array.from({ length: Math.floor(height / u(11)) }, (_, i) => (
        <View key={i} style={{ flexDirection: "row", gap: u(4) }}>
          {Array.from({ length: 2 }, (_, j) => (
            <View key={j} style={{ flex: 1, height: u(5), backgroundColor: (i * 2 + j) % 4 === 1 ? window : "rgba(255,255,255,0.1)" }} />
          ))}
        </View>
      ))}
    </View>
  );
}
