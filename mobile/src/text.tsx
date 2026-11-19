import { StyleSheet, Text as RNText, type TextProps } from "react-native";
import { fonts } from "./theme";

const byWeight: Record<string, string> = {
  "400": fonts.regular,
  normal: fonts.regular,
  "500": fonts.medium,
  "600": fonts.semibold,
  "700": fonts.bold,
  bold: fonts.bold,
  "800": fonts.display,
  "900": fonts.display,
};

/**
 * The app's text: IBM Plex Sans for body copy, Anek Latin for weight 800 headlines and numbers.
 * Custom fonts carry their own weight, so the family is picked from `fontWeight` (an explicit fontFamily wins).
 */
export function Text({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  const family = flat.fontFamily ?? byWeight[String(flat.fontWeight ?? "400")] ?? fonts.regular;
  return <RNText {...props} style={[style, { fontFamily: family, fontWeight: undefined }]} />;
}
