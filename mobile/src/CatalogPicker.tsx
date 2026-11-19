import { Minus, Plus } from "lucide-react-native";
import { useRef } from "react";
import { Image, Pressable, View } from "react-native";
import { Text } from "./text";
import { stepCount, type Catalog, type CatalogItem } from "@/lib/catalogs";
import { catalogImages } from "./catalog-images";
import { colors, radius, shadow } from "./theme";

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
  onUnpick,
}: {
  catalog: Catalog;
  items: Record<string, string>[];
  onChange: (index: number, changes: Record<string, string>) => void;
  onPick: (changes: Record<string, string>) => void;
  onRemove?: (index: number) => void;
  /** Double-tap on a picked item: take it out and clear its part of the form. */
  onUnpick: (index: number) => void;
}) {
  // Last tap on an already-picked item, so a second tap soon after counts as a double tap.
  const lastTap = useRef<{ value: string; at: number } | null>(null);

  function tap(item: CatalogItem) {
    const index = indexOf(item);
    if (index === -1) {
      lastTap.current = null;
      onPick(picked(item));
      return;
    }
    const now = Date.now();
    if (lastTap.current?.value === item.value && now - lastTap.current.at < 400) {
      lastTap.current = null;
      onUnpick(index);
    } else lastTap.current = { value: item.value, at: now };
  }

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
      <Text style={{ fontSize: 12, color: colors.muted, marginTop: -4 }}>Double-tap a picked item to remove it.</Text>
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
                width: "47%",
                flexGrow: 1,
                maxWidth: "50%",
                borderRadius: radius.md,
                borderCurve: "continuous",
                borderWidth: 2,
                borderColor: chosen ? colors.brand : colors.border,
                backgroundColor: colors.surface,
                boxShadow: chosen ? shadow.raised : undefined,
                padding: 8,
                alignItems: "center",
                gap: 6,
              }}
            >
              <Pressable
                accessibilityLabel={chosen ? `${label}, chosen. Double-tap to remove` : `Choose ${label}`}
                onPress={() => tap(item)}
                style={{ width: "100%", alignItems: "center", gap: 2 }}>
                {/* A fixed 4:3 frame, so bundled pictures don't fall back to their file size. */}
                <View style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: radius.sm, overflow: "hidden", backgroundColor: "#ffffff" }}>
                  <Image source={catalogImages[item.image]} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
                </View>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                  {label}
                </Text>
                <Text style={{ fontSize: 11.5, color: colors.muted }}>{item.caption}</Text>
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
