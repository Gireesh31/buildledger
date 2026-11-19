import { Pencil, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { Text } from "./text";
import type { CatalogName } from "@/lib/catalogs";
import { choiceLabel, getCollection, isFieldVisible, type CollectionName, type FieldDef } from "@/lib/collections";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import type { LedgerRecord } from "@/lib/types";
import { api, errorMessage } from "./api";
import { RecordForm } from "./RecordForm";
import { colors, radius } from "./theme";
import { Badge, Button, Empty, Input, StatusBadge } from "./ui";

/** Extra calculated lines on a card, e.g. a bill's balance due or what's owed to a worker. Keyed by record id. */
export type Extra = { label: string; values: Record<string, { text: string; critical?: boolean }> };

/** Saved entries as cards (newest first), with search, edit and delete — like the website on a phone. */
export function RecordList({
  projectId,
  collection,
  records,
  canEdit,
  extras = [],
  catalog,
  onChanged,
}: {
  projectId: string;
  collection: CollectionName;
  records: LedgerRecord[];
  canEdit: boolean;
  extras?: Extra[];
  catalog?: CatalogName;
  onChanged: () => void;
}) {
  const def = getCollection(collection);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const display = (field: FieldDef, record: LedgerRecord): string => {
    const value = record[field.name];
    if (value === undefined || value === "" || !isFieldVisible(field, record)) return "—";
    if (field.kind === "money") return formatINR(Number(value), true);
    if (field.kind === "number") return formatNumber(Number(value));
    if (field.kind === "date") return formatDate(String(value));
    if (field.kind === "select" || field.kind === "radio") return choiceLabel(def, field, record);
    return String(value);
  };

  const sorted = useMemo(() => {
    const list = [...records];
    if (def.dateField) list.sort((a, b) => String(b[def.dateField!]).localeCompare(String(a[def.dateField!])) || b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [records, def.dateField]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((r) => def.fields.some((f) => display(f, r).toLowerCase().includes(q)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, query]);

  const moneyField = def.fields.find((f) => f.kind === "money" && f.name === "amount" && !f.showIf);
  const total = visible.reduce((s, r) => s + (typeof r.amount === "number" ? r.amount : 0), 0);

  function remove(record: LedgerRecord) {
    Alert.alert(`Delete this ${def.singular.toLowerCase()}?`, "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/api/projects/${projectId}/records/${collection}/${record.id}`, { method: "DELETE" });
            onChanged();
          } catch (e) {
            Alert.alert("Couldn't delete", errorMessage(e));
          }
        },
      },
    ]);
  }

  if (records.length === 0) return <Empty text={`No ${def.label.toLowerCase()} yet.`} />;

  // A long text title (daily log's work done) reads better in full under the date.
  const titleField = def.fields.find((f) => f.name === def.titleField);
  const dateAsTitle = titleField?.kind === "textarea";
  const dateField = def.fields.find((f) => f.name === def.dateField);

  return (
    <View style={{ gap: 10 }}>
      {records.length > 1 ? (
        <View>
          <View style={{ position: "absolute", left: 12, top: 13, zIndex: 1 }}>
            <Search size={16} color={colors.faint} />
          </View>
          <Input value={query} onChangeText={setQuery} placeholder={`Search ${def.label.toLowerCase()}…`} style={{ paddingLeft: 36 }} />
        </View>
      ) : null}

      {visible.map((record) => {
        if (editing === record.id) {
          return (
            <RecordForm
              key={record.id}
              projectId={projectId}
              collection={collection}
              record={record}
              catalog={catalog}
              onDone={() => {
                setEditing(null);
                onChanged();
              }}
              onCancel={() => setEditing(null)}
            />
          );
        }
        const heading = dateAsTitle ? (dateField ? display(dateField, record) : def.singular) : titleField ? display(titleField, record) : def.singular;
        const details = def.fields.filter(
          (f) => !f.hideInTable && !f.describes && f !== titleField && f !== dateField && f.name !== "paymentStatus" && f !== moneyField && display(f, record) !== "—",
        );
        const edited = Date.parse(record.updatedAt) - Date.parse(record.createdAt) >= 1000;
        return (
          <View key={record.id} style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontWeight: "700", fontSize: 15, color: colors.text }} numberOfLines={dateAsTitle ? undefined : 1}>
                  {heading}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {!dateAsTitle && dateField ? <Text style={{ fontSize: 12, color: colors.muted }}>{display(dateField, record)}</Text> : null}
                  {edited ? <Badge label={`✎ Edited ${formatDate(record.updatedAt)}`} bg={colors.infoSoft} fg={colors.info} /> : null}
                </View>
              </View>
              {record.paymentStatus ? <StatusBadge status={String(record.paymentStatus)} /> : null}
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8 }}>
              {details.map((field) => (
                <View key={field.name} style={{ width: field.kind === "textarea" ? "100%" : "50%", paddingRight: 8 }}>
                  <Text style={{ fontSize: 11, color: colors.muted }}>{field.label}</Text>
                  <Text style={{ fontSize: 14, color: colors.text }}>{display(field, record)}</Text>
                </View>
              ))}
              {extras.map((extra) => {
                const cell = extra.values[record.id];
                return cell ? (
                  <View key={extra.label} style={{ width: "50%", paddingRight: 8 }}>
                    <Text style={{ fontSize: 11, color: colors.muted }}>{extra.label}</Text>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: cell.critical ? colors.critical : colors.text }}>{cell.text}</Text>
                  </View>
                ) : null;
              })}
            </View>

            {moneyField || canEdit ? (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{moneyField ? display(moneyField, record) : ""}</Text>
                {canEdit ? (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Button small tone="secondary" label="Edit" icon={<Pencil size={13} color={colors.text} />} onPress={() => setEditing(record.id)} />
                    <Button small tone="danger" label="Delete" onPress={() => remove(record)} />
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}

      {moneyField && visible.length > 0 ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.brand, borderRadius: radius.md, padding: 14 }}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>{query ? "Total (filtered)" : "Total"}</Text>
          <Text style={{ color: "#fff", fontWeight: "700" }}>{formatINR(total, true)}</Text>
        </View>
      ) : null}
    </View>
  );
}
