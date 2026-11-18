import { router, Tabs } from "expo-router";
import { ArrowLeft, Ellipsis, LayoutGrid, Package, Truck, Users } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loadProject, ProjectIdContext, useRouteProjectId } from "../../../src/data";
import { colors } from "../../../src/theme";

/** Kept out of the tab bar but still reachable (`href: null` would make them redirect to Overview). */
const HIDDEN = { tabBarButton: () => null, tabBarItemStyle: { display: "none" } } as const;

/** Screens opened from "More"; their back arrow returns there. */
const MORE_SCREENS = ["daily-log", "reports", "files", "team", "settings"];

/** Inside a project: the website's four main tabs, with everything else under "More". */
export default function ProjectTabs() {
  const id = useRouteProjectId();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  useEffect(() => {
    if (!id) return;
    loadProject(id)
      .then((p) => setName(p.name))
      .catch(() => {});
  }, [id]);

  const title = (tab: string) => (name ? `${tab} · ${name}` : tab);
  return (
    <ProjectIdContext.Provider value={id}>
    <Tabs
      screenOptions={({ route, navigation }) => ({
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 66 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 8 },
        headerStyle: { backgroundColor: colors.brand },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700", color: "#fff" },
        headerTitleAlign: "center",
        headerShadowVisible: false,
        animation: "shift",
        headerLeft: () => {
          const fromMore = MORE_SCREENS.includes(route.name);
          return (
            <Pressable
              onPress={() => (fromMore ? navigation.navigate("more") : router.canGoBack() ? router.dismissTo("/") : router.replace("/"))}
              hitSlop={10}
              style={{ paddingHorizontal: 14 }}
              accessibilityLabel={fromMore ? "Back to More" : "Back to projects"}
            >
              <ArrowLeft size={22} color="#fff" />
            </Pressable>
          );
        },
        sceneStyle: { backgroundColor: colors.background },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Overview", headerTitle: title("Overview"), tabBarIcon: ({ color }) => <LayoutGrid size={22} color={color} /> }} />
      <Tabs.Screen name="materials" options={{ title: "Materials", headerTitle: title("Materials"), tabBarIcon: ({ color }) => <Package size={22} color={color} /> }} />
      <Tabs.Screen name="labour" options={{ title: "Labour", headerTitle: title("Labour"), tabBarIcon: ({ color }) => <Users size={22} color={color} /> }} />
      <Tabs.Screen name="transport" options={{ title: "Transport", headerTitle: title("Transport"), tabBarIcon: ({ color }) => <Truck size={22} color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: "More", headerTitle: title("More"), tabBarIcon: ({ color }) => <Ellipsis size={22} color={color} /> }} />
      {/* Opened from "More". */}
      <Tabs.Screen name="daily-log" options={{ ...HIDDEN, headerTitle: title("Daily log") }} />
      <Tabs.Screen name="reports" options={{ ...HIDDEN, headerTitle: title("Reports") }} />
      <Tabs.Screen name="files" options={{ ...HIDDEN, headerTitle: title("Bills & photos") }} />
      <Tabs.Screen name="team" options={{ ...HIDDEN, headerTitle: title("Team") }} />
      <Tabs.Screen name="settings" options={{ ...HIDDEN, headerTitle: title("Settings") }} />
    </Tabs>
    </ProjectIdContext.Provider>
  );
}
