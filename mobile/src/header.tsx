import { View } from "react-native";
import { ConstructionScene } from "./construction-scene";
import { colors, fonts } from "./theme";
import { HazardTape } from "./ui";

/** Dark site-board header with a thin brass line along its bottom edge (stack and tab headers). */
export function HeaderBackground() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.ink, overflow: "hidden" }}>
      <ConstructionScene size={0.42} style={{ position: "absolute", right: 8, bottom: 4, opacity: 0.55 }} />
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <HazardTape height={4} />
      </View>
    </View>
  );
}

export const headerTitleStyle = { fontFamily: fonts.display, fontSize: 20, color: "#fff" } as const;
