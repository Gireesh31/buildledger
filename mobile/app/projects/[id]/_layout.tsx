import { router, Tabs, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Ellipsis, LayoutGrid, Package, Truck, Users } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable } from "react-native";
import { loadProject } from "../../../src/data";
import { colors } from "../../../src/theme";

/** Inside a project: the website's four main tabs, with everything else under "More". */
export default function ProjectTabs() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState("");
  useEffect(() => {
    loadProject(id)
      .then((p) => setName(p.name))
      .catch(() => {});
  }, [id]);

  const title = (tab: string) => (name ? `${tab} · ${name}` : tab);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: "700" },
        headerLeft: () => (
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} hitSlop={10} style={{ paddingHorizontal: 14 }} accessibilityLabel="Back to projects">
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        ),
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Overview", headerTitle: title("Overview"), tabBarIcon: ({ color }) => <LayoutGrid size={22} color={color} /> }} />
      <Tabs.Screen name="materials" options={{ title: "Materials", headerTitle: title("Materials"), tabBarIcon: ({ color }) => <Package size={22} color={color} /> }} />
      <Tabs.Screen name="labour" options={{ title: "Labour", headerTitle: title("Labour"), tabBarIcon: ({ color }) => <Users size={22} color={color} /> }} />
      <Tabs.Screen name="transport" options={{ title: "Transport", headerTitle: title("Transport"), tabBarIcon: ({ color }) => <Truck size={22} color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: "More", headerTitle: title("More"), tabBarIcon: ({ color }) => <Ellipsis size={22} color={color} /> }} />
      {/* Opened from "More". */}
      <Tabs.Screen name="daily-log" options={{ href: null, headerTitle: title("Daily log") }} />
      <Tabs.Screen name="reports" options={{ href: null, headerTitle: title("Reports") }} />
    </Tabs>
  );
}
