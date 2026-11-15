import { Minus, Plus } from "lucide-react-native";
import { Image, Pressable, Text, View } from "react-native";
import { stepCount, type Catalog, type CatalogItem } from "@/lib/catalogs";
import { API_URL } from "./api";
import { colors, radius } from "./theme";

/**
 * Shop-style grid (same as the website): tap + / − under an item to put it in the form with that count.
 * Each picked item gets its own entry in the form.
 */
export function CatalogPicker({
  catalog,
  items,
  onChange,
  onPick,
  onRemove,
}: {
  catalog: Catalog;
  items: Record<string, string>[];
  onChange: (index: number, changes: Record<string, string>) => void;
  onPick: (changes: Record<string, string>) => void;
  onRemove?: (index: number) => void;
}) {
  const name = (value: string) => catalog.options.find((o) => o.value === value)?.label ?? value;
  const indexOf = (item: CatalogItem) => items.findIndex((values) => values[catalog.choiceField] === item.value);
  const picked = (item: CatalogItem, count?: number) => ({
    [catalog.choiceField]: item.value,
    ...(count !== undefined && { [catalog.countField]: String(count), ...catalog.onAdd }),
    ...(catalog.unitField && item.unit && { [catalog.unitField]: item.unit }),
  });

  function change(item: CatalogItem, direction: 1 | -1) {
    const index = indexOf(item);
    if (index === -1) {
      if (direction === 1) onPick(picked(item, item.step));
      return;
    }
    const next = stepCount(Number(items[index][catalog.countField]) || 0, item, direction);
    if (next > 0) onChange(index, { [catalog.countField]: String(next), ...(direction === 1 && catalog.onAdd) });
    else if (onRemove) onRemove(index);
    else onChange(index, { [catalog.countField]: "" });
  }

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>{catalog.prompt}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {catalog.items.map((item) => {
          const index = indexOf(item);
          const chosen = index !== -1;
          const count = chosen ? Number(items[index][catalog.countField]) || 0 : 0;
          const label = name(item.value);
          return (
            <View
              key={item.value}
              style={{
                width: "31.5%",
                flexGrow: 1,
                maxWidth: "33%",
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderColor: chosen ? colors.brand : colors.border,
                backgroundColor: chosen ? colors.brandSoft : colors.surface,
                padding: 6,
                alignItems: "center",
                gap: 4,
              }}
            >
              <Pressable accessibilityLabel={`Choose ${label}`} onPress={() => indexOf(item) === -1 && onPick(picked(item))} style={{ width: "100%", alignItems: "center", gap: 2 }}>
                <Image source={{ uri: `${API_URL}${item.image}` }} style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: radius.sm, backgroundColor: "#F1EFEC" }} resizeMode="contain" />
                <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>
                  {label}
                </Text>
                <Text style={{ fontSize: 10, color: colors.muted }}>{item.caption}</Text>
              </Pressable>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Pressable
                  accessibilityLabel={`Less ${label}`}
                  disabled={count === 0}
                  onPress={() => change(item, -1)}
                  hitSlop={6}
                  style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", opacity: count === 0 ? 0.35 : 1 }}
                >
                  <Minus size={13} color={colors.text} />
                </Pressable>
                <Text style={{ minWidth: 22, textAlign: "center", fontSize: 12, fontWeight: count > 0 ? "700" : "400", color: count > 0 ? colors.brand : colors.faint }}>
                  {count.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </Text>
                <Pressable
                  accessibilityLabel={`More ${label}`}
                  onPress={() => change(item, 1)}
                  hitSlop={6}
                  style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }}
                >
                  <Plus size={13} color="#fff" />
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
