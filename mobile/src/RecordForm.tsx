import { Plus, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Text } from "./text";
import { catalogs, type Catalog, type CatalogName } from "@/lib/catalogs";
import { computeField, getCollection, isFieldVisible, type CollectionName, type FieldDef, type Option } from "@/lib/collections";
import { formatINR, todayISO } from "@/lib/format";
import type { LedgerRecord } from "@/lib/types";
import { api, errorMessage } from "./api";
import { CatalogPicker } from "./CatalogPicker";
import { ChoiceInput, DateInput, SelectInput } from "./inputs";
import { colors, radius } from "./theme";
import { Button, Card, Field, Input, Message } from "./ui";

type Values = Record<string, string>;

/** Starting values: the record's own when editing; otherwise defaults (and nothing picked in the picture picker). */
function initialValues(fields: readonly FieldDef[], record?: LedgerRecord, blank: readonly string[] = []): Values {
  const values: Values = {};
  for (const field of fields) {
    if (field.computed) continue;
    const existing = record?.[field.name];
    if (existing !== undefined) values[field.name] = String(existing);
    else if (blank.includes(field.name)) values[field.name] = "";
    else if (field.defaultValue !== undefined) values[field.name] = field.defaultValue;
    else if (field.kind === "date") values[field.name] = todayISO();
    // Like the website: nothing is chosen for you (only a field's own default, e.g. "Paid").
    else values[field.name] = "";
  }
  return values;
}

/**
 * Add or edit an entry; a new one can hold several items (the picker or "Add more"), saved together.
 * Same fields, defaults and rules as the website's form, from the shared collection definitions.
 */
export function RecordForm({
  projectId,
  collection,
  record,
  catalog,
  multiple,
  refOptions,
  onDone,
  onCancel,
}: {
  projectId: string;
  collection: CollectionName;
  record?: LedgerRecord;
  catalog?: CatalogName;
  multiple?: boolean;
  refOptions?: Option[];
  /** After saving: how many entries were saved. */
  onDone: (count: number) => void;
  onCancel?: () => void;
}) {
  const def = getCollection(collection);
  const picker: Catalog | undefined = catalog ? catalogs[catalog] : undefined;
  const blank = picker ? [picker.choiceField, ...(picker.unitField ? [picker.unitField] : [])] : [];
  const fresh = () => {
    const values = initialValues(def.fields, undefined, blank);
    if (def.dateField && items[active]?.[def.dateField]) values[def.dateField] = items[active][def.dateField];
    return values;
  };
  const [items, setItems] = useState<Values[]>(() => [initialValues(def.fields, record, blank)]);
  const [active, setActive] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const many = multiple && !record;

  function set(index: number, name: string, value: string) {
    setItems((list) =>
      list.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, [name]: value };
        // Choosing a material from the list fills in its usual unit (cement → bag, steel → ton …).
        if (picker?.unitField && name === picker.choiceField) {
          const unit = picker.items.find((p) => p.value === value)?.unit;
          if (unit) next[picker.unitField] = unit;
        }
        return next;
      }),
    );
  }

  /** A picture tapped in the picker: fills an empty item, or adds a new one when the form takes several. */
  function pickItem(changes: Values) {
    const choice = picker?.choiceField ?? "";
    const empty = !items[active]?.[choice] ? active : items.findIndex((item) => !item[choice]);
    if (!many || empty !== -1) {
      const index = many ? empty : active;
      setItems((list) => list.map((item, i) => (i === index ? { ...item, ...changes } : item)));
      setActive(index);
      return;
    }
    setItems((list) => [...list, { ...fresh(), ...changes }]);
    setActive(items.length);
  }

  function addItem() {
    setItems((list) => [...list, fresh()]);
    setActive(items.length);
  }

  function removeItem(index: number) {
    setItems((list) => list.filter((_, i) => i !== index));
    setActive((current) => (current === index ? Math.max(0, index - 1) : current > index ? current - 1 : current));
  }

  /** A picked item double-tapped: drop its entry, or clear the form when it's the only one. */
  function unpickItem(index: number) {
    if (many && items.length > 1) return removeItem(index);
    const cleared = initialValues(def.fields, undefined, blank);
    if (def.dateField && items[index]?.[def.dateField]) cleared[def.dateField] = items[index][def.dateField];
    setItems((list) => list.map((item, i) => (i === index ? cleared : item)));
  }

  const totalOf =(item: Values) => def.fields.filter((f) => f.computed).reduce((s, f) => s + computeField(def, f, item), 0);

  async function save() {
    setPending(true);
    setError(null);
    const base = `/api/projects/${projectId}/records/${collection}`;
    // Saved one by one; if one fails, the saved ones leave the form so a retry doesn't duplicate them.
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const body = Object.fromEntries(def.fields.filter((f) => !f.computed && isFieldVisible(f, item)).map((f) => [f.name, item[f.name]]));
      try {
        await api(record ? `${base}/${record.id}` : base, { method: record ? "PUT" : "POST", body });
      } catch (e) {
        setItems((list) => list.slice(i));
        setActive(0);
        setError(items.length > 1 ? `Item ${i + 1}: ${errorMessage(e)}` : errorMessage(e));
        setPending(false);
        return;
      }
    }
    setPending(false);
    setItems([initialValues(def.fields, undefined, blank)]);
    setActive(0);
    onDone(items.length);
  }

  return (
    <Card title={record ? `Edit ${def.singular.toLowerCase()}` : `New ${def.singular.toLowerCase()}`}>
      {error ? <Message text={error} /> : null}
      {picker ? (
        <CatalogPicker
          catalog={picker}
          items={items}
          onChange={(index, changes) => Object.entries(changes).forEach(([name, value]) => set(index, name, value))}
          onPick={pickItem}
          onRemove={many && items.length > 1 ? removeItem : undefined}
          onUnpick={unpickItem}
        />
      ) : null}

      {items.map((item, index) => (
        <View
          key={index}
          onTouchStart={() => setActive(index)}
          style={
            items.length > 1
              ? { gap: 12, borderWidth: 1.5, borderColor: index === active ? colors.brand : colors.border, borderRadius: radius.md, padding: 12 }
              : { gap: 12 }
          }
        >
          {items.length > 1 ? (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontWeight: "700", color: colors.text }}>
                {def.singular} {index + 1}
              </Text>
              <Pressable onPress={() => removeItem(index)} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Trash2 size={14} color={colors.critical} />
                <Text style={{ color: colors.critical, fontSize: 13 }}>Remove</Text>
              </Pressable>
            </View>
          ) : null}

          {def.fields
            .filter((f) => !f.computed && isFieldVisible(f, item))
            .map((field) => (
              <Field key={field.name} label={field.label} required={field.required}>
                <FieldInput field={field} value={item[field.name] ?? ""} options={field.kind === "ref" ? refOptions : undefined} onChange={(v) => set(index, field.name, v)} />
              </Field>
            ))}

          {def.fields
            .filter((f) => f.computed)
            .map((field) => (
              <View key={field.name} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", backgroundColor: colors.background, borderRadius: radius.md, padding: 12 }}>
                <Text style={{ color: colors.muted, fontWeight: "600" }}>{field.label}</Text>
                <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text }}>{formatINR(computeField(def, field, item), true)}</Text>
              </View>
            ))}

          {item.paymentStatus === "partial"
            ? (() => {
                // Bills: the calculated total and paidAmount. Teams: their fixed amount and amountPaid.
                const total = totalOf(item) || Number(item.amount) || 0;
                const paid = Number(item.paidAmount ?? item.amountPaid) || 0;
                return total > 0 ? (
                  <View style={{ backgroundColor: colors.criticalSoft, borderRadius: radius.md, padding: 12 }}>
                    <Text style={{ color: colors.muted, fontSize: 13 }}>
                      Paid {formatINR(paid, true)} of {formatINR(total, true)}
                    </Text>
                    <Text style={{ color: colors.critical, fontSize: 20, fontWeight: "700" }}>Balance due {formatINR(Math.max(0, total - paid), true)}</Text>
                  </View>
                ) : null;
              })()
            : null}
        </View>
      ))}

      {many ? (
        <Pressable
          onPress={addItem}
          style={{ flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.brand, borderRadius: radius.md, paddingVertical: 12 }}
        >
          <Plus size={16} color={colors.brand} />
          <Text style={{ color: colors.brand, fontWeight: "700" }}>Add more</Text>
        </Pressable>
      ) : null}

      {items.length > 1 && def.fields.some((f) => f.computed) ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.text, borderRadius: radius.md, padding: 14 }}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>Grand total · {items.length}</Text>
          <Text style={{ color: "#fff", fontWeight: "700" }}>{formatINR(items.reduce((s, item) => s + totalOf(item), 0), true)}</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button
            tone="secondary"
            label={onCancel ? "Cancel" : "Clear"}
            onPress={() => {
              setItems([initialValues(def.fields, record, blank)]);
              setActive(0);
              setError(null);
              onCancel?.();
            }}
          />
        </View>
        <View style={{ flex: 2 }}>
          <Button label={items.length > 1 ? `Save all ${items.length}` : "Save"} busy={pending} onPress={save} />
        </View>
      </View>
    </Card>
  );
}

function FieldInput({ field, value, onChange, options }: { field: FieldDef; value: string; onChange: (v: string) => void; options?: Option[] }) {
  switch (field.kind) {
    case "date":
      return <DateInput value={value} onChange={onChange} />;
    case "radio":
      return <ChoiceInput value={value} options={field.options ?? []} onChange={onChange} />;
    case "select":
    case "ref":
      return <SelectInput title={field.label} value={value} options={(field.kind === "ref" ? options : field.options) ?? []} onChange={onChange} />;
    case "money":
      return <Input prefix="₹" value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder="0" />;
    case "number":
      return <Input value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder="0" />;
    case "phone":
      return <Input value={value} onChangeText={onChange} keyboardType="phone-pad" placeholder="98765 43210" />;
    case "textarea":
      return <Input value={value} onChangeText={onChange} multiline placeholder={field.placeholder} />;
    default:
      return <Input value={value} onChangeText={onChange} placeholder={field.placeholder} />;
  }
}
