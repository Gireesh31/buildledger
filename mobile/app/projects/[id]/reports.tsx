import { useLocalSearchParams } from "expo-router";
import { FileDown } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { formatDate, formatINR, formatNumber, todayISO } from "@/lib/format";
import { LEDGER_COLLECTIONS } from "@/lib/ledger";
import { buildPeriodReport, periodRange, type PeriodMode } from "@/lib/period-report";
import { errorMessage } from "../../../src/api";
import { loadCollections, loadProject, useLoad } from "../../../src/data";
import { DateInput } from "../../../src/inputs";
import { buildReportData } from "../../../src/reportData";
import { sharePeriodReportPdf } from "../../../src/reportPdf";
import { colors } from "../../../src/theme";
import { Button, Card, Chip, Empty, Field, Loading, Message, Screen, StatTile, StatusBadge, TileGrid } from "../../../src/ui";

const MODES: { value: PeriodMode; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "total", label: "Day 1 to today" },
  { value: "custom", label: "Custom" },
];

function periodLabel(mode: PeriodMode, from: string, to: string) {
  if (mode === "total") return `${formatDate(from)} (day 1) - ${formatDate(to)}`;
  return from === to ? formatDate(from) : `${formatDate(from)} - ${formatDate(to)}`;
}

/** The website's period report (shared code), with a PDF to share from the phone. */
export default function Reports() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: loaded, error, refreshing, onRefresh } = useLoad(async () => {
    const [project, records] = await Promise.all([loadProject(id), loadCollections(id, LEDGER_COLLECTIONS)]);
    return { project, data: buildReportData(project, records) };
  });
  const [mode, setMode] = useState<PeriodMode>("total");
  const [date, setDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [sharing, setSharing] = useState(false);

  const reportDate = mode === "total" ? todayISO() : date;
  const report = useMemo(() => (loaded ? buildPeriodReport(loaded.data, mode, reportDate, todayISO(), endDate) : null), [loaded, mode, reportDate, endDate]);
  if (!loaded || !report) return error ? <Screen onRefresh={onRefresh}><Message text={error} /></Screen> : <Loading />;
  const { from, to } = periodRange(mode, reportDate, loaded.data.startDate, endDate);
  const label = periodLabel(mode, from, to);
  const t = report.totals;

  async function share() {
    setSharing(true);
    try {
      await sharePeriodReportPdf(report!, loaded!.project.name, label);
    } catch (e) {
      Alert.alert("Couldn't create the PDF", errorMessage(e));
    } finally {
      setSharing(false);
    }
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {MODES.map((m) => (
          <Chip key={m.value} label={m.label} selected={mode === m.value} onPress={() => setMode(m.value)} />
        ))}
      </ScrollView>
      {mode === "custom" ? (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="From">
              <DateInput value={date} onChange={setDate} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="To">
              <DateInput value={endDate} onChange={setEndDate} />
            </Field>
          </View>
        </View>
      ) : mode !== "total" ? (
        <Field label={`Any date in the ${mode}`}>
          <DateInput value={date} onChange={setDate} />
        </Field>
      ) : null}

      <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>{label}</Text>
      <TileGrid>
        <StatTile label="Materials" value={formatINR(t.materials)} />
        <StatTile label="Labour" value={formatINR(t.labour)} />
        <StatTile label="Transport" value={formatINR(t.transport)} />
        <StatTile label="Total spent" value={formatINR(t.spent)} hint={t.billsDue > 0 ? `${formatINR(t.billsDue)} still owed on bills` : undefined} critical={t.billsDue > 0} />
        <StatTile label="Paid out" value={formatINR(t.paid)} />
        <StatTile label="Outstanding dues" value={formatINR(t.due)} hint={`as of ${formatDate(report.duesAsOf)}`} critical={t.due > 0} />
      </TileGrid>
      <Button label="Share PDF report" icon={<FileDown size={17} color="#fff" />} busy={sharing} onPress={share} />

      <Card title={`Material purchases (${report.materials.length})`}>
        {report.materials.length === 0 ? <Empty text="No material purchases in this period." /> : null}
        {report.materials.map((m, i) => (
          <Line key={i} title={`${m.material} · ${formatNumber(m.quantity)} ${m.unit}`} sub={`${formatDate(m.date)} · ${formatINR(m.unitPrice, true)} each${m.paymentMode ? ` · ${m.paymentMode}` : ""}`} amount={m.amount} status={m.status} balance={m.balance} />
        ))}
      </Card>
      <Card title={`Workers & teams (${report.workers.length})`}>
        {report.workers.length === 0 ? <Empty text="No workers or teams added in this period." /> : null}
        {report.workers.map((w) => (
          <Line
            key={w.id}
            title={`${w.name} · ${w.isTeam ? "Team" : "Worker"}`}
            sub={`${formatDate(w.date)} · ${w.trade} · ${w.isTeam ? `team ${formatINR(w.amount)}` : `${formatINR(w.dailyWage)}/day`} · paid ${formatINR(w.amountPaid)}`}
            status={w.status}
            dueText={w.due > 0 ? `Due ${formatINR(w.due)}` : w.due < 0 ? `${formatINR(-w.due)} advance` : "Paid"}
            critical={w.due > 0}
          />
        ))}
      </Card>
      <Card title={`Transport & machinery (${report.transport.length})`}>
        {report.transport.length === 0 ? <Empty text="No vehicles hired in this period." /> : null}
        {report.transport.map((v, i) => (
          <Line
            key={i}
            title={`${v.vehicle}${v.transportName ? ` · ${v.transportName}` : ""}`}
            sub={`${formatDate(v.date)} · ${v.hours !== null ? `${formatNumber(v.hours)} hrs × ${formatINR(v.ratePerHour ?? 0)}` : "Full amount"}`}
            amount={v.amount}
            status={v.status}
            balance={v.balance}
          />
        ))}
      </Card>
      <Card title={`Outstanding dues as of ${formatDate(report.duesAsOf)}`}>
        {report.dues.length === 0 ? <Empty text="Nothing owed. All workers and teams are settled." /> : null}
        {report.dues.map((d, i) => (
          <Line key={i} title={`${d.name} · ${d.kind}`} sub={`Earned ${formatINR(d.earned)} · paid ${formatINR(d.paid)}`} dueText={formatINR(d.due)} critical />
        ))}
      </Card>
    </Screen>
  );
}

function Line({ title, sub, amount, status, balance, dueText, critical }: { title: string; sub: string; amount?: number; status?: string; balance?: number; dueText?: string; critical?: boolean }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontWeight: "600", color: colors.text }}>{title}</Text>
        <Text style={{ fontSize: 12, color: colors.muted }}>{sub}</Text>
        {status ? <StatusBadge status={status} /> : null}
      </View>
      <View style={{ alignItems: "flex-end" }}>
        {amount !== undefined ? <Text style={{ fontWeight: "700", color: colors.text }}>{formatINR(amount, true)}</Text> : null}
        {balance ? <Text style={{ fontSize: 12, fontWeight: "600", color: colors.critical }}>Due {formatINR(balance, true)}</Text> : null}
        {dueText ? <Text style={{ fontWeight: "700", color: critical ? colors.critical : colors.text }}>{dueText}</Text> : null}
      </View>
    </View>
  );
}
