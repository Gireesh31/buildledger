import { Link, router, Stack } from "expo-router";
import { Building2, ChevronRight, Plus, UserRound } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { formatINR, formatINRCompact } from "@/lib/format";
import { computeLedger, LEDGER_COLLECTIONS } from "@/lib/ledger";
import type { Project, ProjectRole } from "@/lib/types";
import { projectStatuses } from "@/lib/validation";
import { api } from "../src/api";
import { useAuth } from "../src/auth";
import { loadCollections, useLoad } from "../src/data";
import { colors, radius } from "../src/theme";
import { Button, Empty, Loading, Message, Screen, SectionTitle, StatTile, TileGrid } from "../src/ui";

/** Home: every project you own or were invited to, with what's been spent. */
export default function Dashboard() {
  const { user } = useAuth();
  const { data, error, refreshing, onRefresh } = useLoad(async () => {
    const accessible = await api<{ project: Project; role: ProjectRole }[]>("/api/projects");
    return Promise.all(
      accessible.map(async ({ project, role }) => ({ project, role, ledger: computeLedger({ project, ...(await loadCollections(project.id, LEDGER_COLLECTIONS)) }) })),
    );
  });

  const header = (
    <Stack.Screen
      options={{
        headerRight: () => (
          <Pressable onPress={() => router.push("/profile")} hitSlop={10} accessibilityLabel="Your profile">
            <UserRound size={22} color={colors.text} />
          </Pressable>
        ),
      }}
    />
  );
  if (!data) return error ? <Screen onRefresh={onRefresh}>{header}<Message text={error} /></Screen> : <Loading />;

  const totals = data.reduce((acc, { ledger }) => ({ spent: acc.spent + ledger.totalCost, budget: acc.budget + ledger.budget, due: acc.due + ledger.workerDueTotal }), {
    spent: 0,
    budget: 0,
    due: 0,
  });

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {header}
      <View>
        <Text style={{ color: colors.brand, fontWeight: "600" }}>Dashboard</Text>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text }}>Namaste, {user?.name.split(" ")[0]}</Text>
        <Text style={{ color: colors.muted }}>Here’s where your sites stand today.</Text>
      </View>
      {error ? <Message text={error} /> : null}
      <TileGrid>
        <StatTile label="Projects" value={String(data.length)} hint={`${data.filter((r) => r.project.status === "active").length} in progress`} />
        <StatTile label="Total spent" value={formatINR(totals.spent)} />
        <StatTile label="Total budget" value={formatINR(totals.budget)} />
        <StatTile label="Owed to workers" value={formatINR(totals.due)} critical={totals.due > 0} />
      </TileGrid>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <SectionTitle text="Your projects" />
        <Button small label="New project" icon={<Plus size={15} color="#fff" />} onPress={() => router.push("/projects/new")} />
      </View>

      {data.length === 0 ? (
        <Empty text="No projects yet. Tap “New project” to add your first site." />
      ) : (
        data.map(({ project, role, ledger }) => {
          const used = ledger.budget > 0 ? Math.min(1, ledger.totalCost / ledger.budget) : 0;
          return (
            <Link key={project.id} href={`/projects/${project.id}`} asChild>
              <Pressable style={({ pressed }) => ({ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10, opacity: pressed ? 0.85 : 1 })}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ backgroundColor: colors.brandSoft, borderRadius: 10, padding: 8 }}>
                    <Building2 size={20} color={colors.brand} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", fontSize: 16, color: colors.text }} numberOfLines={1}>
                      {project.name}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={1}>
                      {project.location || "No location"} · {projectStatuses.find((s) => s.value === project.status)?.label}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.faint} />
                </View>
                <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{formatINR(ledger.totalCost)}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{ledger.budget > 0 ? `of ${formatINRCompact(ledger.budget)}` : "spent"}</Text>
                </View>
                {ledger.budget > 0 ? (
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: "hidden" }}>
                    <View style={{ width: `${used * 100}%`, height: 6, backgroundColor: ledger.totalCost > ledger.budget ? colors.critical : colors.brand }} />
                  </View>
                ) : null}
                <Text style={{ fontSize: 12, color: colors.muted }}>{role === "owner" ? "Owner" : `Shared with you · ${role}`}</Text>
              </Pressable>
            </Link>
          );
        })
      )}
    </Screen>
  );
}
