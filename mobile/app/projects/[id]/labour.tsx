import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { Text } from "../../../src/text";
import { isTeam, optionLabel, trades } from "@/lib/collections";
import { formatINR, formatNumber, todayISO } from "@/lib/format";
import { computeLedger } from "@/lib/ledger";
import type { LedgerRecord, Project } from "@/lib/types";
import { api, errorMessage } from "../../../src/api";
import { loadRecords, useLoad, useProjectId } from "../../../src/data";
import { EntryPage } from "../../../src/EntryPage";
import { DateInput } from "../../../src/inputs";
import { colors } from "../../../src/theme";
import { Button, Card, Chip, Empty, Field } from "../../../src/ui";

/** What each worker or team has earned, been paid and is owed (shared ledger code, same as the website). */
const duesOf = (workers: LedgerRecord[], attendance: LedgerRecord[]) =>
  computeLedger({ project: {} as Project, workers, attendance, transport: [], materials: [] });

export default function Labour() {
  const id = useProjectId();
  const attendance = useLoad(() => loadRecords(id, "attendance"), `attendance:${id}`);

  return (
    <EntryPage
      collection="workers"
      multiple
      extras={(workers) => [
        {
          label: "Due",
          values: Object.fromEntries(
            duesOf(workers, attendance.data ?? []).workerDues.map((w) => [
              w.id,
              w.due > 0 ? { text: formatINR(w.due), critical: true } : { text: w.due < 0 ? `${formatINR(-w.due)} advance` : "Paid" },
            ]),
          ),
        },
      ]}
      footer={(workers) => (
        <>
          <AttendanceSheet projectId={id} workers={workers.filter((w) => !isTeam(w))} attendance={attendance.data ?? []} onSaved={() => void attendance.reload()} />
          <Dues workers={workers} attendance={attendance.data ?? []} />
        </>
      )}
    />
  );
}

const STATUSES = [
  { value: "present", label: "Present" },
  { value: "half", label: "Half day" },
  { value: "absent", label: "Absent" },
] as const;

/** Mark one day's attendance for the individual workers (teams are paid a fixed amount). */
function AttendanceSheet({ projectId, workers, attendance, onSaved }: { projectId: string; workers: LedgerRecord[]; attendance: LedgerRecord[]; onSaved: () => void }) {
  const [date, setDate] = useState(todayISO());
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Start from what's already saved for the chosen day.
  useEffect(() => {
    setMarks(Object.fromEntries(attendance.filter((a) => a.date === date).map((a) => [String(a.workerId), String(a.status)])));
  }, [date, attendance]);

  async function save() {
    setSaving(true);
    try {
      await api(`/api/projects/${projectId}/attendance`, {
        method: "PUT",
        body: { date, entries: Object.entries(marks).map(([workerId, status]) => ({ workerId, status })) },
      });
      onSaved();
      Alert.alert("Attendance saved");
    } catch (e) {
      Alert.alert("Couldn't save attendance", errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Daily attendance">
      <Field label="Date">
        <DateInput value={date} onChange={setDate} />
      </Field>
      {workers.length === 0 ? (
        <Empty text="Add individual workers above to mark their attendance." />
      ) : (
        <>
          {workers.map((w) => (
            <View key={w.id} style={{ gap: 6, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
              <Text style={{ fontWeight: "600", color: colors.text }}>
                {String(w.name)} <Text style={{ color: colors.muted, fontWeight: "400" }}>· {optionLabel({ name: "trade", label: "Trade", kind: "select", options: trades }, w.trade)} · {formatINR(Number(w.dailyWage) || 0)}/day</Text>
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {STATUSES.map((s) => (
                  <Chip key={s.value} label={s.label} selected={marks[w.id] === s.value} onPress={() => setMarks((m) => ({ ...m, [w.id]: s.value }))} />
                ))}
              </View>
            </View>
          ))}
          <Button label="Save attendance" busy={saving} onPress={save} />
        </>
      )}
    </Card>
  );
}

function Dues({ workers, attendance }: { workers: LedgerRecord[]; attendance: LedgerRecord[] }) {
  const { workerDues, labourCost } = duesOf(workers, attendance);
  if (workerDues.length === 0) return null;
  return (
    <Card title={`Wages and dues · total labour ${formatINR(labourCost)}`}>
      {workerDues.map((w) => (
        <View key={w.id} style={{ flexDirection: "row", justifyContent: "space-between", gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "600", color: colors.text }}>{w.name}</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {w.isTeam ? "Team" : `${formatNumber(w.days)} days`} · earned {formatINR(w.earned)} · paid {formatINR(w.paid)}
            </Text>
          </View>
          <Text style={{ fontWeight: "700", color: w.due > 0 ? colors.critical : colors.text }}>{w.due < 0 ? `${formatINR(-w.due)} advance` : formatINR(w.due)}</Text>
        </View>
      ))}
    </Card>
  );
}
