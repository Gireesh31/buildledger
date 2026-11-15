import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { formatINR, formatNumber } from "@/lib/format";
import { computeLedger, LEDGER_COLLECTIONS, outstandingBills } from "@/lib/ledger";
import { loadCollections, loadProject, useLoad } from "../../../src/data";
import { colors } from "../../../src/theme";
import { Card, Empty, Loading, Message, Screen, StatTile, TileGrid } from "../../../src/ui";

/** Project overview: the same totals as the website (shared ledger code). */
export default function Overview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, refreshing, onRefresh } = useLoad(async () => {
    const [project, records] = await Promise.all([loadProject(id), loadCollections(id, LEDGER_COLLECTIONS)]);
    return { project, records, ledger: computeLedger({ project, ...records }) };
  });
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
