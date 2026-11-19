import { View } from "react-native";
import { Text } from "../../../src/text";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import { projectStatuses, projectTypes } from "@/lib/validation";
import { computeLedger, LEDGER_COLLECTIONS, outstandingBills } from "@/lib/ledger";
import { loadCollections, loadProject, useLoad, useProjectId } from "../../../src/data";
import { colors } from "../../../src/theme";
import { Card, Empty, Loading, Message, Screen, StatTile, TileGrid } from "../../../src/ui";

/** Project overview: the same totals as the website (shared ledger code). */
export default function Overview() {
  const id = useProjectId();
  const { data, error, refreshing, onRefresh } = useLoad(async () => {
    const [project, records] = await Promise.all([loadProject(id), loadCollections(id, LEDGER_COLLECTIONS)]);
    return { project, records, ledger: computeLedger({ project, ...records }) };
  }, `overview:${id}`);
  if (!data) return error ? <Screen onRefresh={onRefresh}><Message text={error} /></Screen> : <Loading />;
  const { project, ledger, records } = data;
  const bills = outstandingBills([...records.materials, ...records.transport]);
  const largest = ledger.byCategory[0]?.amount ?? 0;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {error ? <Message text={error} /> : null}
      <View>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>{project.name}</Text>
        <Text style={{ color: colors.muted }}>
          {[project.location, project.areaSqft ? `${formatNumber(project.areaSqft)} sq ft` : ""].filter(Boolean).join(" · ") || "No location"}
        </Text>
      </View>
      <TileGrid>
        <StatTile label="Total spent" value={formatINR(ledger.totalCost)} />
        <StatTile
          label="Budget left"
          value={ledger.budget > 0 ? formatINR(ledger.remaining) : "—"}
          hint={ledger.budgetUsedPct !== null ? `${Math.round(ledger.budgetUsedPct)}% used` : "No budget set"}
          critical={ledger.budget > 0 && ledger.remaining < 0}
        />
        <StatTile label="Materials" value={formatINR(ledger.materialTotal)} />
        <StatTile label="Labour" value={formatINR(ledger.labourCost)} />
        <StatTile label="Transport" value={formatINR(ledger.transportTotal)} />
        <StatTile label="Cost per sq ft" value={ledger.costPerSqft !== null ? formatINR(ledger.costPerSqft) : "—"} />
        <StatTile label="Owed to workers" value={formatINR(ledger.workerDueTotal)} critical={ledger.workerDueTotal > 0} />
        <StatTile label="Unpaid bills" value={formatINR(bills.amount)} hint={`${bills.count} bill${bills.count === 1 ? "" : "s"}`} critical={bills.amount > 0} />
      </TileGrid>

      <Card title="Project details">
        {[
          ["Status", projectStatuses.find((s) => s.value === project.status)?.label ?? project.status],
          ["Type", projectTypes.find((t) => t.value === project.projectType)?.label ?? "—"],
          ["Location", project.location || "—"],
          ["Budget", project.budget ? formatINR(project.budget) : "—"],
          ["Built-up area", project.areaSqft ? `${formatNumber(project.areaSqft)} sq ft` : "—"],
          ["Start date", project.startDate ? formatDate(project.startDate) : "—"],
          ["Expected finish", project.endDate ? formatDate(project.endDate) : "—"],
          ["Your access", project.role === "owner" ? "Owner" : project.role === "editor" ? "Can edit" : "View only"],
        ].map(([label, value]) => (
          <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
            <Text style={{ color: colors.muted }}>{label}</Text>
            <Text style={{ flexShrink: 1, textAlign: "right", fontWeight: "600", color: colors.text }}>{value}</Text>
          </View>
        ))}
        {project.description ? <Text style={{ color: colors.text, paddingTop: 4 }}>{project.description}</Text> : null}
      </Card>

      <Card title="Spend by category">
        {ledger.byCategory.length === 0 ? (
          <Empty text="No spending recorded yet." />
        ) : (
          ledger.byCategory.map((c) => (
            <View key={c.key} style={{ gap: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: colors.text }}>{c.label}</Text>
                <Text style={{ fontWeight: "700", color: colors.text }}>{formatINR(c.amount)}</Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border }}>
                <View style={{ width: `${(c.amount / largest) * 100}%`, height: 6, borderRadius: 3, backgroundColor: colors.brand }} />
              </View>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
