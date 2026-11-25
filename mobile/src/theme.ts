/** The website's colours and type, so the app looks like the same product. */
export const colors = {
  brand: "#1F5135",
  brandStrong: "#163D27",
  brandSoft: "#E8F0EA",
  /** Brass highlight; brassLight is for text and icons on the dark header. */
  brass: "#B8860B",
  brassLight: "#E2CF9E",
  /** Dark green-charcoal for headers and emphasis. */
  ink: "#1A2420",
  inkSoft: "#25322C",
  background: "#F4F4F2",
  surface: "#FFFFFF",
  /** Filled form fields on white cards. */
  field: "#F6F6F4",
  text: "#1B1F1C",
  muted: "#5F655F",
  faint: "#9BA19A",
  border: "#E2E3DF",
  critical: "#B42318",
  criticalSoft: "#FDECEA",
  good: "#1E7A46",
  goodSoft: "#E3F1E8",
  info: "#2D5B7A",
  infoSoft: "#E6EEF4",
  warn: "#8A6410",
  warnSoft: "#F6EEDB",
} as const;

export const radius = { sm: 8, md: 12, lg: 14 } as const;

/** Font families loaded in app/_layout.tsx. `Text` from ./text picks body weights from fontWeight. */
export const fonts = {
  regular: "SourceSans3_400Regular",
  medium: "SourceSans3_500Medium",
  semibold: "SourceSans3_600SemiBold",
  bold: "SourceSans3_700Bold",
  /** Headlines and big numbers (fontWeight "800"): Fraunces serif, same as the website. */
  display: "Fraunces_600SemiBold",
  displayBold: "Fraunces_700Bold",
  /** Small uppercase labels. */
  mono: "IBMPlexMono_500Medium",
} as const;

export const shadow = {
  card: "0 1px 2px rgba(27, 31, 28, 0.06)",
  raised: "0 4px 12px -6px rgba(31, 81, 53, 0.45)",
} as const;
