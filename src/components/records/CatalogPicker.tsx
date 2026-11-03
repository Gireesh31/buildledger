"use client";

import { Minus, Plus } from "lucide-react";
import { stagger } from "@/components/ui/primitives";
import { stepCount, type Catalog, type CatalogItem } from "@/lib/catalogs";

interface CatalogPickerProps {
  catalog: Catalog;
  /** The form's items (one, or several when the form takes more than one). */
  items: Record<string, string>[];
  /** Sets fields on one item. */
  onChange: (index: number, changes: Record<string, string>) => void;
  /** Puts a newly picked item into the form. */
  onPick: (changes: Record<string, string>) => void;
  /** Takes an item out of the form (its count went down to zero). Without it the count is just cleared. */
  onRemove?: (index: number) => void;
}

/**
 * Shop-style grid: tap + / − under an item to put it in the form with that count.
 * Each picked item has its own entry in the form, so several can be picked at once.
 */
export function CatalogPicker({ catalog, items, onChange, onPick, onRemove }: CatalogPickerProps) {
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
      // Not in the form yet: start from one step.
      if (direction === 1) onPick(picked(item, item.step));
      return;
    }
    const next = stepCount(Number(items[index][catalog.countField]) || 0, item, direction);
    if (next > 0) onChange(index, { [catalog.countField]: String(next), ...(direction === 1 && catalog.onAdd) });
    else if (onRemove) onRemove(index);
    else onChange(index, { [catalog.countField]: "" });
  }

  /** Tapping the picture just puts the item in the form. */
  function select(item: CatalogItem) {
    if (indexOf(item) === -1) onPick(picked(item));
  }

  return (
    <section aria-label={catalog.prompt}>
      <p className="mb-2 text-sm font-medium text-foreground/80">{catalog.prompt}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {catalog.items.map((item, i) => {
          const index = indexOf(item);
          const isChosen = index !== -1;
          const count = isChosen ? Number(items[index][catalog.countField]) || 0 : 0;
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
