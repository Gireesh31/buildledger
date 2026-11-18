import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../src/auth";
import { colors } from "../src/theme";
import { Loading } from "../src/ui";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootStack />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

/** Signed-in screens only for signed-in people, and sign-in screens only for everyone else. */
function RootStack() {
  const { user } = useAuth();
  if (user === undefined) return <Loading />;
  // New accounts see the welcome steps once, like the website's onboarding.
  const onboarded = Boolean(user?.onboardedAt);
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.brand },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Protected guard={Boolean(user) && !onboarded}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(user) && onboarded}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="projects/new" options={{ title: "New project" }} />
        <Stack.Screen name="projects/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: "Your profile" }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="register" options={{ title: "Create account" }} />
        <Stack.Screen name="forgot-password" options={{ title: "Forgot password" }} />
      </Stack.Protected>
    </Stack>
  );
}
