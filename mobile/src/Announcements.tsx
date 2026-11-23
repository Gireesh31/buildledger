import { router } from "expo-router";
import { Gift, Megaphone, Sparkles, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Image, Linking, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import type { Announcement, AnnouncementKind } from "@/lib/app-config";
import { api, API_URL, prefs } from "./api";
import { MediaView } from "./MediaView";
import { Text } from "./text";
import { colors } from "./theme";
import { FadeIn } from "./ui";

const STORAGE_KEY = "buildledger-dismissed-announcements";

const STYLE: Record<AnnouncementKind, { tag: string; Icon: typeof Megaphone }> = {
  news: { tag: "ANNOUNCEMENT", Icon: Megaphone },
  feature: { tag: "NEW FEATURE", Icon: Sparkles },
  offer: { tag: "OFFER", Icon: Gift },
};

/**
 * Announcements, new features and offers the admin published, inside the home screen's dark animated
 * header (same as the website dashboard). Swipe between them; each can be closed.
 */
export function Announcements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[] | null>(null);
  const [page, setPage] = useState(0);
  const { width } = useWindowDimensions();
  const cardWidth = width - 32;

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
    setPage(0);
    void prefs.set(STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <FadeIn delay={140} style={{ marginTop: 18 }}>
      <ScrollView
        horizontal
        pagingEnabled
        snapToInterval={cardWidth + 10}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / (cardWidth + 10)))}
        contentContainerStyle={{ gap: 10 }}
      >
        {visible.map((a) => (
          <Card key={a.id} announcement={a} width={cardWidth} onClose={() => close(a.id)} />
        ))}
      </ScrollView>
      {visible.length > 1 ? (
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 }}>
          {visible.map((a, i) => (
            <View key={a.id} style={{ height: 6, width: i === page ? 18 : 6, borderRadius: 3, backgroundColor: i === page ? colors.brand : "rgba(255,255,255,0.35)" }} />
          ))}
        </View>
      ) : null}
    </FadeIn>
  );
}

function Card({ announcement: a, width, onClose }: { announcement: Announcement; width: number; onClose: () => void }) {
  const { tag, Icon } = STYLE[a.kind];
  const [shown, setShown] = useState(0);
  const media = a.media[Math.min(shown, a.media.length - 1)];

  function open(url: string) {
    // The app has its own screen for a new project; other site pages open in the browser.
    if (url.startsWith("/projects/new")) router.push("/projects/new");
    else void Linking.openURL(url.startsWith("/") ? `${API_URL}${url}` : url);
  }

  return (
    <View
      style={{
        width,
        gap: 8,
        padding: 14,
        borderRadius: 16,
        borderCurve: "continuous",
        backgroundColor: "rgba(29, 27, 24, 0.82)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.14)",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(232, 89, 12, 0.22)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Icon size={13} color="#FDBA8C" />
          <Text style={{ fontSize: 10.5, color: "#FDBA8C", fontWeight: "700", letterSpacing: 0.8 }}>{tag}</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10} accessibilityLabel={`Close ${a.title}`}>
          <X size={18} color="rgba(255,255,255,0.6)" />
        </Pressable>
      </View>

      {media ? <MediaView key={media.path} media={media} /> : null}
      {a.media.length > 1 ? (
        <View style={{ flexDirection: "row", gap: 6 }}>
          {a.media.map((m, i) => (
            <Pressable
              key={m.path}
              onPress={() => setShown(i)}
              accessibilityLabel={`Show ${m.type} ${i + 1}`}
              style={{ width: 52, height: 32, borderRadius: 6, overflow: "hidden", borderWidth: 2, borderColor: i === shown ? colors.brand : "transparent", backgroundColor: "#000" }}
            >
              {m.type === "image" ? (
                <Image source={{ uri: m.url }} style={{ width: "100%", height: "100%" }} />
              ) : (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#fff", fontSize: 12 }}>▶</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={{ fontSize: 17, fontWeight: "800", color: "#fff" }}>{a.title}</Text>
      {a.body ? <Text style={{ fontSize: 13.5, color: "rgba(255,255,255,0.75)", lineHeight: 19 }}>{a.body}</Text> : null}
      {a.linkUrl ? (
        <Pressable onPress={() => open(a.linkUrl!)} hitSlop={6} accessibilityRole="link">
          <Text style={{ color: "#FDBA8C", fontWeight: "700", fontSize: 14 }}>{a.linkLabel ?? "Learn more"} →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
