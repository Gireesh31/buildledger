import { router } from "expo-router";
import { ListChecks, Megaphone, ToggleRight, Users } from "lucide-react-native";
import { api } from "../../src/api";
import { NavRow } from "../../src/admin-ui";
import { useLoad } from "../../src/data";
import { colors } from "../../src/theme";
import { Loading, Message, Screen, SectionTitle, StatTile, TileGrid } from "../../src/ui";

interface Stats {
  users: number;
  verifiedUsers: number;
}

/** Admin overview: totals across everyone, and the sections of the panel. */
export default function AdminHome() {
  const { data, error, refreshing, onRefresh } = useLoad(() => api<Stats>("/api/admin/stats"), "admin-stats");
  if (!data && !error) return <Loading />;
  const icon = (Icon: typeof Users) => <Icon size={20} color={colors.brand} />;
  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {error ? <Message text={error} /> : null}
      {data ? (
        <TileGrid>
          <StatTile label="Users" value={String(data.users)} />
          <StatTile label="Verified emails" value={String(data.verifiedUsers)} />
        </TileGrid>
      ) : null}
      <SectionTitle text="Manage" />
      <NavRow icon={icon(Users)} label="Users" hint="Edit, verify, disable, make admin, delete" onPress={() => router.push("/admin/users")} />
      <NavRow icon={icon(ListChecks)} label="Forms" hint="Dropdown choices and extra fields" onPress={() => router.push("/admin/forms")} />
      <NavRow icon={icon(ToggleRight)} label="Features" hint="Switch sections on or off for everyone" onPress={() => router.push("/admin/features")} />
      <NavRow icon={icon(Megaphone)} label="Announcements" hint="News, new features and offers" onPress={() => router.push("/admin/announcements")} />
    </Screen>
  );
}
