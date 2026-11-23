import { Gift, Megaphone, Sparkles, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { router } from "expo-router";
import type { Announcement, AnnouncementKind } from "@/lib/app-config";
import { api, API_URL, prefs } from "./api";
import { Text } from "./text";
import { colors } from "./theme";
import { styles } from "./ui";

const STORAGE_KEY = "buildledger-dismissed-announcements";

const STYLE: Record<AnnouncementKind, { tag: string; bg: string; fg: string; Icon: typeof Megaphone }> = {
  news: { tag: "ANNOUNCEMENT", bg: colors.infoSoft, fg: colors.info, Icon: Megaphone },
  feature: { tag: "NEW FEATURE", bg: "#EDE9FE", fg: "#6D28D9", Icon: Sparkles },
  offer: { tag: "OFFER", bg: colors.brandSoft, fg: colors.brandStrong, Icon: Gift },
};

/** Announcements, new features and offers the admin published (same as the website dashboard). Each can be closed. */
export function Announcements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[] | null>(null);

  const load = useCallback(async () => {
    const [list, saved] = await Promise.all([api<Announcement[]>("/api/announcements").catch(() => []), prefs.get(STORAGE_KEY)]);
    let closed: string[] = [];
    try {
      const parsed = JSON.parse(saved ?? "[]");
      if (Array.isArray(parsed)) closed = parsed.filter((v) => typeof v === "string");
    } catch {
      // Ignore a damaged list.
    }
    setItems(list);
    setDismissed(closed);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!dismissed) return null;
  const visible = items.filter((a) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  function close(id: string) {
    const next = [...(dismissed ?? []), id].slice(-50);
    setDismissed(next);
    void prefs.set(STORAGE_KEY, JSON.stringify(next));
  }

  function open(url: string) {
    // Links to the website's own pages open there; the app has its own screens for projects.
    if (url.startsWith("/projects/new")) router.push("/projects/new");
    else void Linking.openURL(url.startsWith("/") ? `${API_URL}${url}` : url);
  }

  return (
    <View style={{ gap: 10 }}>
      {visible.map((a) => {
        const { tag, bg, fg, Icon } = STYLE[a.kind];
        return (
          <View key={a.id} style={[styles.card, { flexDirection: "row", gap: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: fg }]}>
            <View style={{ backgroundColor: bg, borderRadius: 12, padding: 9, alignSelf: "flex-start" }}>
              <Icon size={18} color={fg} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text style={{ fontSize: 10.5, color: fg, fontWeight: "700", letterSpacing: 0.8 }}>{tag}</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{a.title}</Text>
              {a.body ? <Text style={{ fontSize: 13.5, color: colors.muted, lineHeight: 19 }}>{a.body}</Text> : null}
              {a.linkUrl ? (
                <Pressable onPress={() => open(a.linkUrl!)} hitSlop={6} accessibilityRole="link">
                  <Text style={{ marginTop: 4, color: colors.brand, fontWeight: "700", fontSize: 14 }}>{a.linkLabel ?? "Learn more"} →</Text>
                </Pressable>
              ) : null}
            </View>
            <Pressable onPress={() => close(a.id)} hitSlop={10} accessibilityLabel={`Close ${a.title}`} style={{ alignSelf: "flex-start" }}>
              <X size={18} color={colors.faint} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
