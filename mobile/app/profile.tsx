import { Linking, Text, View } from "react-native";
import { formatDate } from "@/lib/format";
import { API_URL } from "../src/api";
import { useAuth } from "../src/auth";
import { colors } from "../src/theme";
import { Button, Card, Screen } from "../src/ui";

export default function Profile() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  const rows: [string, string | undefined][] = [
    ["Name", user.name],
    ["Email", user.email],
    ["Phone", user.phone],
    ["Location", user.location],
    ["Member since", formatDate(user.createdAt)],
  ];
  return (
    <Screen>
      <Card>
        {rows.map(([label, value]) => (
          <View key={label} style={{ gap: 2 }}>
            <Text style={{ fontSize: 12, color: colors.muted }}>{label}</Text>
            <Text style={{ fontSize: 15, color: colors.text }}>{value || "—"}</Text>
          </View>
        ))}
      </Card>
      <Button tone="secondary" label="Edit profile on the website" onPress={() => Linking.openURL(`${API_URL}/profile`)} />
      <Button tone="danger" label="Sign out" onPress={signOut} />
    </Screen>
  );
}
