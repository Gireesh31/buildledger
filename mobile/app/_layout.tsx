import { AnekLatin_700Bold, AnekLatin_800ExtraBold } from "@expo-google-fonts/anek-latin";
import { IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold } from "@expo-google-fonts/ibm-plex-sans";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../src/auth";
import { HeaderBackground, headerTitleStyle } from "../src/header";
import { WifiOff } from "lucide-react-native";
import { View } from "react-native";
import { colors, fonts } from "../src/theme";
import { Button, Loading, Text } from "../src/ui";

export default function RootLayout() {
  // The website's type: IBM Plex Sans for text, Anek Latin for headlines, IBM Plex Mono for labels.
  const [fontsLoaded, fontError] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
    AnekLatin_700Bold,
    AnekLatin_800ExtraBold,
    IBMPlexMono_500Medium,
  });
  if (!fontsLoaded && !fontError) return <Loading />;
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootStack />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

/** Shown when the app opens without internet: the person is still signed in, so offer a retry, not the sign-in page. */
function CantConnect({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 28, gap: 14 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }}>
        <WifiOff size={28} color={colors.brand} />
      </View>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.text, textAlign: "center" }}>Can't connect</Text>
      <Text style={{ fontSize: 15, color: colors.muted, textAlign: "center", lineHeight: 21 }}>
        {message} You're still signed in.
      </Text>
      <View style={{ alignSelf: "stretch", marginTop: 6 }}>
        <Button label="Try again" onPress={onRetry} />
      </View>
    </View>
  );
}

/** Signed-in screens only for signed-in people, and sign-in screens only for everyone else. */
function RootStack() {
  const { user, startupError, retry } = useAuth();
  if (startupError) return <CantConnect message={startupError} onRetry={retry} />;
  if (user === undefined) return <Loading />;
  // New accounts see the welcome steps once, like the website's onboarding.
  const onboarded = Boolean(user?.onboardedAt);
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
