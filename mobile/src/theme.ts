/** The website's colours and type, so the app looks like the same product. */
export const colors = {
  brand: "#E8590C",
  brandStrong: "#C44A08",
  brandSoft: "#FFF0E5",
  /** Dark site-board colour for headers and emphasis. */
  ink: "#1D1B18",
  inkSoft: "#2B2622",
  background: "#F5F3EE",
  surface: "#FFFFFF",
  /** Filled form fields on white cards. */
  field: "#F7F5F0",
  text: "#16161A",
  muted: "#6B6862",
  faint: "#A29E95",
  border: "#E6E2D8",
  critical: "#D03B3B",
  criticalSoft: "#FDE8E8",
  good: "#047857",
  goodSoft: "#D1FAE5",
  info: "#0369A1",
  infoSoft: "#E0F2FE",
  warn: "#B45309",
  warnSoft: "#FEF3C7",
} as const;

export const radius = { sm: 10, md: 14, lg: 18 } as const;

/** Font families loaded in app/_layout.tsx. `Text` from ./text picks body weights from fontWeight. */
export const fonts = {
  regular: "IBMPlexSans_400Regular",
  medium: "IBMPlexSans_500Medium",
  semibold: "IBMPlexSans_600SemiBold",
  bold: "IBMPlexSans_700Bold",
  /** Headlines and big numbers (fontWeight "800"). */
  display: "AnekLatin_800ExtraBold",
  displayBold: "AnekLatin_700Bold",
  /** Small uppercase labels. */
  mono: "IBMPlexMono_500Medium",
} as const;

export const shadow = {
  card: "0 1px 2px rgba(22, 22, 26, 0.05), 0 10px 24px -14px rgba(22, 22, 26, 0.22)",
  raised: "0 6px 16px -6px rgba(232, 89, 12, 0.55)",
} as const;
