"use client";

import { Minus, Plus } from "lucide-react";
import { stagger } from "@/components/ui/primitives";
import { stepCount, type Catalog, type CatalogItem } from "@/lib/catalogs";

interface CatalogPickerProps {
  catalog: Catalog;
  /** Current form values. */
  values: Record<string, string>;
  /** Sets form fields. */
  onChange: (changes: Record<string, string>) => void;
}

/**
 * Shop-style grid: tap + / − under an item to put it in the form with that count.
 * One item is in the form at a time, so the selected card shows the form's count.
 */
export function CatalogPicker({ catalog, values, onChange }: CatalogPickerProps) {
  const chosen = values[catalog.choiceField] ?? "";
  const current = Number(values[catalog.countField]) || 0;
  const name = (value: string) => catalog.options.find((o) => o.value === value)?.label ?? value;

  function change(item: CatalogItem, direction: 1 | -1) {
    if (item.value !== chosen) {
      // Switching item: start from one step.
      if (direction === 1) {
        onChange({
          [catalog.choiceField]: item.value,
          [catalog.countField]: String(item.step),
          ...(catalog.unitField && item.unit && { [catalog.unitField]: item.unit }),
          ...catalog.onAdd,
        });
      }
      return;
    }
    const next = stepCount(current, item, direction);
    onChange({ [catalog.countField]: next > 0 ? String(next) : "", ...(direction === 1 && catalog.onAdd) });
  }

  /** Tapping the picture just selects the item. */
  function select(item: CatalogItem) {
    if (item.value === chosen) return;
    onChange({
      [catalog.choiceField]: item.value,
      ...(catalog.unitField && item.unit && { [catalog.unitField]: item.unit }),
    });
  }

  return (
    <section aria-label={catalog.prompt}>
      <p className="mb-2 text-sm font-medium text-foreground/80">{catalog.prompt}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {catalog.items.map((item, i) => {
          const isChosen = item.value === chosen;
          const count = isChosen ? current : 0;
          const label = name(item.value);
          return (
            <li
              key={item.value}
              className={`group/card animate-fade-up flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                isChosen ? "border-brand bg-brand-soft" : "border-foreground/[0.08] bg-surface hover:border-brand/40"
              }`}
              style={stagger(i, 30)}
            >
              <button type="button" onClick={() => select(item)} className="flex w-full flex-col items-center gap-1" aria-label={`Choose ${label}`}>
                <span className="product-stage block aspect-[4/3] w-full overflow-hidden rounded-xl">
                  {/* Background-free product cut-outs on a studio backdrop; a plain img avoids the image optimiser. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt=""
                    width={400}
                    height={300}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain transition-transform duration-300 ease-out group-hover/card:-translate-y-1 group-hover/card:scale-[1.04]"
                  />
                </span>
                <span className="line-clamp-1 text-sm font-medium">{label}</span>
                <span className="text-xs text-foreground/50">{item.caption}</span>
              </button>
              <div className="flex items-center gap-1" role="group" aria-label={`${label} ${catalog.countField}`}>
                <button
                  type="button"
                  onClick={() => change(item, -1)}
                  disabled={count === 0}
                  aria-label={`Less ${label}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-foreground/15 transition-all hover:border-brand hover:text-brand active:scale-90 disabled:opacity-30"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className={`min-w-7 text-xs tabular-nums ${count > 0 ? "font-semibold text-brand" : "text-foreground/40"}`} aria-live="polite">
                  {count.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
                <button
                  type="button"
                  onClick={() => change(item, 1)}
                  aria-label={`More ${label}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white transition-all hover:bg-brand-strong active:scale-90"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
