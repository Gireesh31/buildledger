import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../src/auth";
import { HeaderBackground, headerTitleStyle } from "../../src/header";
import { colors } from "../../src/theme";

/** The admin panel. Non-admins never get here (the root stack guards it); this redirect is a second check. */
export default function AdminLayout() {
  const { user } = useAuth();
  if (!user?.isAdmin) return <Redirect href="/" />;
  return (
    <Stack
      screenOptions={{
        headerBackground: HeaderBackground,
        headerTintColor: "#fff",
        headerTitleStyle,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Admin panel" }} />
      <Stack.Screen name="users/index" options={{ title: "Users" }} />
      <Stack.Screen name="users/[id]" options={{ title: "User" }} />
      <Stack.Screen name="forms" options={{ title: "Forms" }} />
      <Stack.Screen name="features" options={{ title: "Features" }} />
      <Stack.Screen name="announcements" options={{ title: "Announcements" }} />
    </Stack>
  );
}
