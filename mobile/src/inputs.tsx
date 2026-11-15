import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, Check, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Modal, Platform, Pressable, Text, View } from "react-native";
import type { Option } from "@/lib/collections";
import { formatDate } from "@/lib/format";
import { colors, radius } from "./theme";
import { Chip, styles } from "./ui";

const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** A date ("YYYY-MM-DD") picked from the phone's own calendar. */
export function DateInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  return (
    <>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={[styles.inputBox, { paddingHorizontal: 12, paddingVertical: 11, gap: 8 }]}>
        <Calendar size={17} color={colors.brand} />
        <Text style={{ fontSize: 15, color: value ? colors.text : colors.faint, flex: 1 }}>{value ? formatDate(value) : "Pick a date"}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, picked) => {
            // Android shows a dialog and iOS an inline calendar; either way, one pick closes it.
            setOpen(false);
            if (event.type === "set" && picked) onChange(toISO(picked));
          }}
        />
      )}
    </>
  );
}

/** A dropdown: tapping opens the full list in a sheet. */
export function SelectInput({
  value,
  options,
  onChange,
  placeholder = "Select…",
  title,
}: {
  value: string;
  options: readonly Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const chosen = options.find((o) => o.value === value);
  return (
    <>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={[styles.inputBox, { paddingHorizontal: 12, paddingVertical: 11 }]}>
        <Text style={{ flex: 1, fontSize: 15, color: chosen ? colors.text : colors.faint }}>{chosen?.label ?? placeholder}</Text>
        <ChevronDown size={18} color={colors.muted} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} onPress={() => setOpen(false)} />
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: "70%", paddingBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", padding: 16, color: colors.text }}>{title}</Text>
          <FlatList
            data={options as Option[]}
            keyExtractor={(o) => o.value}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  backgroundColor: pressed || item.value === value ? colors.brandSoft : undefined,
                })}
              >
                <Text style={{ flex: 1, fontSize: 15, color: colors.text }}>{item.label}</Text>
                {item.value === value ? <Check size={18} color={colors.brand} /> : null}
              </Pressable>
            )}
            ListEmptyComponent={<Text style={{ padding: 16, color: colors.muted }}>Nothing to choose yet.</Text>}
          />
        </View>
      </Modal>
    </>
  );
}

/** A row of choice buttons (payment mode, payment status, …). */
export function ChoiceInput({ value, options, onChange }: { value: string; options: readonly Option[]; onChange: (value: string) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => (
        <Chip key={o.value} label={o.label} selected={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );
}
