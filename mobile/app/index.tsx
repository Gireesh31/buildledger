import { router } from "expo-router";
import { Building2, ChevronRight, Plus, ShieldCheck, UserRound } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import { Text } from "../src/text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatINR, formatINRCompact } from "@/lib/format";
import { computeLedger, LEDGER_COLLECTIONS } from "@/lib/ledger";
import type { Project, ProjectRole } from "@/lib/types";
import { projectStatuses } from "@/lib/validation";
import { api } from "../src/api";
import { afterWelcome, useAuth } from "../src/auth";
import { loadCollections, useLoad } from "../src/data";
import { colors, fonts } from "../src/theme";
import { VerifyEmailCard } from "../src/VerifyEmailCard";
import { Announcements } from "../src/Announcements";
import { ConstructionScene } from "../src/construction-scene";
import { Badge, Button, Empty, Eyebrow, FadeIn, Glow, HazardTape, Loading, Message, PressableScale, Screen, SectionTitle, StatTile, styles, TileGrid } from "../src/ui";

/** Home: every project you own or were invited to, with what's been spent. */
export default function Dashboard() {
  const { user } = useAuth();
  const { data, error, refreshing, onRefresh } = useLoad(async () => {
    const accessible = await api<{ project: Project; role: ProjectRole }[]>("/api/projects");
    return Promise.all(
      accessible.map(async ({ project, role }) => ({ project, role, ledger: computeLedger({ project, ...(await loadCollections(project.id, LEDGER_COLLECTIONS)) }) })),
    );
  }, `home`);

  // Coming from "Get started" on the welcome screen.
  useEffect(() => {
    const route = afterWelcome.route;
    afterWelcome.route = null;
    if (route) router.push(route);
  }, []);

  const insets = useSafeAreaInsets();
  const first = user?.firstName || user?.name.split(" ")[0] || "";
  const totals = (data ?? []).reduce((acc, { ledger }) => ({ spent: acc.spent + ledger.totalCost, budget: acc.budget + ledger.budget, due: acc.due + ledger.workerDueTotal }), {
    spent: 0,
    budget: 0,
    due: 0,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Full-width banner under the status bar. */}
      <View style={{ backgroundColor: colors.ink, paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 28, overflow: "hidden" }}>
        {/* A warm glow in the corner, like the website hero. */}
        <Glow />
        <ConstructionScene size={0.82} style={{ position: "absolute", right: -4, bottom: 0, opacity: 0.9 }} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ backgroundColor: colors.brand, borderRadius: 10, borderCurve: "continuous", padding: 6 }}>
              <Building2 size={18} color="#fff" />
            </View>
            <Text style={{ color: "#fff", fontSize: 21, fontWeight: "800" }}>
              Build<Text style={{ color: colors.brassLight, fontWeight: "800" }}>Ledger</Text>
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {user?.isAdmin ? (
              <Pressable onPress={() => router.push("/admin")} hitSlop={10} accessibilityLabel="Admin panel" style={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 999, padding: 9 }}>
                <ShieldCheck size={20} color={colors.brassLight} />
              </Pressable>
            ) : null}
            <Pressable onPress={() => router.push("/profile")} hitSlop={10} accessibilityLabel="Your profile" style={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 999, padding: 9 }}>
              <UserRound size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
        <FadeIn delay={60}>
          <View style={{ marginTop: 22, gap: 4 }}>
            <Eyebrow text="Dashboard" light />
            <Text style={{ fontSize: 36, fontWeight: "800", color: "#fff", letterSpacing: -0.5 }}>Namaste, {first}</Text>
            <Text style={{ color: "rgba(255,255,255,0.7)" }}>Here’s where your sites stand today.</Text>
          </View>
        </FadeIn>
        {/* The admin's announcements, offers and new features, in the animated header like the website. */}
        <Announcements />
      </View>
      <HazardTape />

      {!data ? (
        error ? (
          <Screen onRefresh={onRefresh}>
            <Message text={error} />
          </Screen>
        ) : (
          <Loading />
        )
      ) : (
        <Screen refreshing={refreshing} onRefresh={onRefresh}>
          {error ? <Message text={error} /> : null}
          {user && !user.emailVerifiedAt ? <VerifyEmailCard email={user.email} /> : null}
          <TileGrid>
            <StatTile label="Projects" value={String(data.length)} hint={`${data.filter((r) => r.project.status === "active").length} in progress`} />
            <StatTile label="Total spent" value={formatINR(totals.spent)} />
            <StatTile label="Total budget" value={totals.budget > 0 ? formatINR(totals.budget) : "—"} />
            <StatTile label="Owed to workers" value={formatINR(totals.due)} critical={totals.due > 0} />
          </TileGrid>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <SectionTitle text="Your projects" />
            <Button small label="New project" icon={<Plus size={15} color="#fff" />} onPress={() => router.push("/projects/new")} />
          </View>

          {data.length === 0 ? <Empty text="No projects yet. Tap “New project” to add your first site." /> : null}
          {data.map(({ project, role, ledger }) => (
            <ProjectCard key={project.id} project={project} role={role} spent={ledger.totalCost} budget={ledger.budget} />
          ))}
        </Screen>
      )}
    </View>
  );
}

function ProjectCard({ project, role, spent, budget }: { project: Project; role: ProjectRole; spent: number; budget: number }) {
  const used = budget > 0 ? Math.min(1, spent / budget) : 0;
  const status = projectStatuses.find((s) => s.value === project.status)?.label ?? project.status;
  return (
    <PressableScale onPress={() => router.push(`/projects/${project.id}`)} accessibilityRole="button" style={[styles.card, { gap: 12 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ backgroundColor: colors.brandSoft, borderRadius: 14, borderCurve: "continuous", padding: 11 }}>
          <Building2 size={22} color={colors.brand} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontWeight: "800", fontSize: 21, color: colors.text }} numberOfLines={1}>
            {project.name}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13 }} numberOfLines={1}>
            {project.location || "No location"}
          </Text>
        </View>
        <ChevronRight size={20} color={colors.faint} />
      </View>

      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <View>
          <Text style={{ fontSize: 10.5, color: colors.muted, fontFamily: fonts.mono, letterSpacing: 0.8, textTransform: "uppercase" }}>Spent</Text>
          <Text style={{ fontSize: 27, fontWeight: "800", color: colors.text, fontVariant: ["tabular-nums"] }}>{formatINR(spent)}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 10.5, color: colors.muted, fontFamily: fonts.mono, letterSpacing: 0.8, textTransform: "uppercase" }}>Budget</Text>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{budget > 0 ? formatINRCompact(budget) : "Not set"}</Text>
        </View>
      </View>
      {budget > 0 ? (
        <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.field, overflow: "hidden" }}>
          <View style={{ width: `${Math.max(used * 100, 2)}%`, height: 8, borderRadius: 4, backgroundColor: spent > budget ? colors.critical : colors.brand }} />
        </View>
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Badge label={status} bg={colors.brandSoft} fg={colors.brandStrong} />
        <Text style={{ fontSize: 12, color: colors.muted }}>{role === "owner" ? "Owner" : role === "editor" ? "Shared · can edit" : "Shared · view only"}</Text>
      </View>
    </PressableScale>
  );
}
