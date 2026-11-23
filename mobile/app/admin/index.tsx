import { router } from "expo-router";
import { FolderKanban, ListChecks, Megaphone, ToggleRight, Users } from "lucide-react-native";
import { formatINR } from "@/lib/format";
import { api } from "../../src/api";
import { NavRow } from "../../src/admin-ui";
import { useLoad } from "../../src/data";
import { colors } from "../../src/theme";
import { Loading, Message, Screen, SectionTitle, StatTile, TileGrid } from "../../src/ui";

interface Stats {
  users: number;
  verifiedUsers: number;
  disabledUsers: number;
  admins: number;
  newUsers30d: number;
  projects: number;
  records: number;
  files: number;
  materialSpend: number;
  transportSpend: number;
  labourPaid: number;
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
          <StatTile label="Users" value={String(data.users)} hint={`${data.newUsers30d} new in 30 days`} />
          <StatTile label="Verified" value={String(data.verifiedUsers)} hint={`${data.disabledUsers} disabled · ${data.admins} admins`} />
          <StatTile label="Projects" value={String(data.projects)} />
          <StatTile label="Entries" value={String(data.records)} hint={`${data.files} bills & photos`} />
          <StatTile label="Material bills" value={formatINR(data.materialSpend)} />
          <StatTile label="Transport bills" value={formatINR(data.transportSpend)} />
        </TileGrid>
      ) : null}
      <SectionTitle text="Manage" />
      <NavRow icon={icon(Users)} label="Users" hint="Edit, verify, disable, make admin, delete" onPress={() => router.push("/admin/users")} />
      <NavRow icon={icon(FolderKanban)} label="Projects" hint="Open any project and edit its entries" onPress={() => router.push("/admin/projects")} />
      <NavRow icon={icon(ListChecks)} label="Forms" hint="Dropdown choices and extra fields" onPress={() => router.push("/admin/forms")} />
      <NavRow icon={icon(ToggleRight)} label="Features" hint="Switch sections on or off for everyone" onPress={() => router.push("/admin/features")} />
      <NavRow icon={icon(Megaphone)} label="Announcements" hint="News, new features and offers" onPress={() => router.push("/admin/announcements")} />
    </Screen>
  );
}
