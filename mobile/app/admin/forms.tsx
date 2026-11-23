import { Archive, ArchiveRestore, Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import type { AppConfig } from "@/lib/app-config";
import type { CollectionName, CustomField, FormConfig, Option } from "@/lib/collections";
import {
  choiceFieldsOf,
  choiceRows,
  customFieldsOf,
  customKinds,
  editableForms,
  fieldLabel,
  formLabel,
  newChoiceValue,
  newCustomFieldName,
  parseChoiceList,
  takesCustomFields,
  withChoiceRows,
  withCustomFields,
} from "@/lib/form-editor";
import { api, errorMessage } from "../../src/api";
import { SwitchRow } from "../../src/admin-ui";
import { useAppConfig } from "../../src/config";
import { Text } from "../../src/text";
import { colors } from "../../src/theme";
import { Badge, Button, Card, Chip, Field, Input, Message, Screen } from "../../src/ui";

/** Dropdown choices and extra fields for the entry forms, the same editor as the website's. */
export default function AdminForms() {
  const { config, set } = useAppConfig();
  const [forms, setForms] = useState<FormConfig>(config.forms);
  const [saved, setSaved] = useState(JSON.stringify(config.forms));
  const [tab, setTab] = useState<CollectionName>("materials");
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const dirty = JSON.stringify(forms) !== saved;

  async function save() {
    setPending(true);
    setNote(null);
    try {
      const result = await api<AppConfig>("/api/admin/settings", { method: "PUT", body: { forms } });
      set(result);
      setForms(result.forms);
      setSaved(JSON.stringify(result.forms));
      setNote({ text: "Saved. Forms on the website and in the app now use these.", tone: "success" });
    } catch (e) {
      setNote({ text: errorMessage(e), tone: "error" });
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen animate={false}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {editableForms.map((name) => (
          <Chip key={name} label={formLabel(name)} selected={tab === name} onPress={() => setTab(name)} />
        ))}
      </View>
      {note ? <Message text={note.text} tone={note.tone} /> : null}
      <Button label={dirty ? "Save changes" : "Saved"} icon={<Save size={17} color="#fff" />} busy={pending} disabled={!dirty} onPress={save} />
      {choiceFieldsOf(tab).map(({ field }) => (
        <ChoiceEditor key={`${tab}.${field}`} forms={forms} setForms={setForms} collection={tab} field={field} />
      ))}
      {takesCustomFields(tab) ? <CustomFieldsEditor key={`${tab}.custom`} forms={forms} setForms={setForms} collection={tab} /> : null}
    </Screen>
  );
}

interface EditorProps {
  forms: FormConfig;
  setForms: (forms: FormConfig) => void;
  collection: CollectionName;
}

function IconButton({ onPress, label, disabled, children }: { onPress: () => void; label: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} hitSlop={8} style={{ padding: 8, opacity: disabled ? 0.35 : 1 }}>
      {children}
    </Pressable>
  );
}

function ChoiceEditor({ forms, setForms, collection, field }: EditorProps & { field: string }) {
  const rows = choiceRows(forms, collection, field);
  const [newLabel, setNewLabel] = useState("");
  const update = (next: typeof rows) => setForms(withChoiceRows(forms, collection, field, next));

  function add() {
    const label = newLabel.trim();
    if (!label) return;
    update([...rows, { value: newChoiceValue(rows, label), label, builtIn: false, locked: false, hidden: false }]);
    setNewLabel("");
  }

  return (
    <Card title={`${fieldLabel(collection, field)} choices`}>
      <Text style={{ color: colors.muted, fontSize: 13 }}>Rename, hide or add. Hidden choices leave the form; older entries keep them.</Text>
      {rows.map((row, i) => (
        <View key={row.value} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ flex: 1, opacity: row.hidden ? 0.5 : 1 }}>
            <Input value={row.label} maxLength={60} onChangeText={(label) => update(rows.map((r, j) => (j === i ? { ...r, label } : r)))} />
          </View>
          <IconButton
            label={row.hidden ? "Show in the form" : "Hide from the form"}
            disabled={row.locked}
            onPress={() => update(rows.map((r, j) => (j === i ? { ...r, hidden: !r.hidden } : r)))}
          >
            {row.hidden ? <EyeOff size={20} color={colors.muted} /> : <Eye size={20} color={colors.text} />}
          </IconButton>
          {!row.builtIn ? (
            <IconButton label="Remove" onPress={() => update(rows.filter((_, j) => j !== i))}>
              <Trash2 size={20} color={colors.critical} />
            </IconButton>
          ) : null}
        </View>
      ))}
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Input value={newLabel} onChangeText={setNewLabel} maxLength={60} placeholder="New choice" onSubmitEditing={add} returnKeyType="done" />
        </View>
        <Button small tone="secondary" label="Add" icon={<Plus size={14} color={colors.text} />} disabled={!newLabel.trim()} onPress={add} />
      </View>
    </Card>
  );
}

function CustomFieldsEditor({ forms, setForms, collection }: EditorProps) {
  const fields = customFieldsOf(forms, collection);
  const update = (next: CustomField[]) => setForms(withCustomFields(forms, collection, next));
  const change = (i: number, patch: Partial<CustomField>) => update(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));

  return (
    <Card title="Extra fields">
      <Text style={{ color: colors.muted, fontSize: 13 }}>Your own fields, shown under “More details” in the form. Archive one to take it off the form and keep what was entered.</Text>
      {fields.map((f, i) => (
        <View key={f.name} style={{ gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, opacity: f.archived ? 0.6 : 1 }}>
          {f.archived ? <Badge label="Archived" bg={colors.field} fg={colors.muted} /> : null}
          <Field label="Name" required>
            <Input value={f.label} maxLength={60} onChangeText={(label) => change(i, { label })} />
          </Field>
          <Field label="Type">
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {customKinds.map((k) => (
                <Chip key={k.value} label={k.label} selected={f.kind === k.value} onPress={() => change(i, { kind: k.value, options: k.value === "select" ? (f.options ?? []) : undefined })} />
              ))}
            </View>
          </Field>
          {f.kind === "select" ? <ChoiceListInput value={f.options ?? []} onChange={(options) => change(i, { options })} /> : null}
          <SwitchRow label="Required" value={Boolean(f.required)} onChange={(required) => change(i, { required: required || undefined })} />
          <Button
            small
            tone="secondary"
            label={f.archived ? "Put back on the form" : "Archive"}
            icon={f.archived ? <ArchiveRestore size={14} color={colors.text} /> : <Archive size={14} color={colors.text} />}
            onPress={() => change(i, { archived: !f.archived || undefined })}
          />
        </View>
      ))}
      <Button
        small
        tone="secondary"
        label="Add field"
        icon={<Plus size={14} color={colors.text} />}
        disabled={fields.length >= 20}
        onPress={() => update([...fields, { name: newCustomFieldName(collection, fields, "New field"), label: "New field", kind: "text" }])}
      />
    </Card>
  );
}

/** One choice per line, applied when the box loses focus. */
function ChoiceListInput({ value, onChange }: { value: Option[]; onChange: (options: Option[]) => void }) {
  const [text, setText] = useState(value.map((o) => o.label).join("\n"));
  return (
    <Field label="Choices (one per line)">
      <Input
        value={text}
        onChangeText={(next) => {
          setText(next);
          onChange(parseChoiceList(next, value));
        }}
        multiline
        placeholder={"Ground floor\nFirst floor"}
      />
    </Field>
  );
}
