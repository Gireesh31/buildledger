/**
 * Shop-style pickers shown above a form: picture cards with − / + that fill the form.
 * Each catalog says which form fields the card choice and the count go into.
 */
import { materialCategories, vehicleTypes, type Option } from "@/lib/collections";

export interface CatalogItem {
  value: string;
  image: string;
  /** Amount added or removed per tap. */
  step: number;
  /** Shown under the name, e.g. "per bag". */
  caption: string;
  /** Unit to put in the form when this item is chosen. */
  unit?: string;
}

export interface Catalog {
  prompt: string;
  /** Form field that holds the chosen item. */
  choiceField: string;
  /** Form field the − / + count goes into. */
  countField: string;
  /** Form field for the item's unit, if any. */
  unitField?: string;
  /** Extra values to set when + is tapped, e.g. switch to hourly charging. */
  onAdd?: Record<string, string>;
  options: readonly Option[];
  items: CatalogItem[];
}

export const catalogs = {
  material: {
    prompt: "Tap + to add a material",
    choiceField: "category",
    countField: "quantity",
    unitField: "unit",
    options: materialCategories,
    items: [
      { value: "cement", unit: "bag", step: 1, caption: "per bag", image: "/photos/materials/cement.webp" },
      { value: "steel", unit: "ton", step: 0.1, caption: "per ton", image: "/photos/materials/steel.webp" },
      { value: "sand", unit: "load", step: 1, caption: "per load", image: "/photos/materials/sand.webp" },
      { value: "aggregate", unit: "brass", step: 1, caption: "per brass", image: "/photos/materials/aggregate.webp" },
      { value: "bricks", unit: "nos", step: 100, caption: "per nos", image: "/photos/materials/bricks.webp" },
      { value: "wood", unit: "cft", step: 1, caption: "per cu ft", image: "/photos/materials/wood.webp" },
      { value: "electrical", unit: "nos", step: 1, caption: "per nos", image: "/photos/materials/electrical.webp" },
      { value: "plumbing", unit: "nos", step: 1, caption: "per nos", image: "/photos/materials/plumbing.webp" },
      { value: "paint", unit: "litre", step: 1, caption: "per litre", image: "/photos/materials/paint.webp" },
      { value: "tiles", unit: "sqft", step: 10, caption: "per sq ft", image: "/photos/materials/tiles.webp" },
      { value: "other", unit: "nos", step: 1, caption: "per nos", image: "/photos/materials/other.webp" },
    ],
  },
  vehicle: {
    prompt: "Tap + to add a vehicle (each tap adds an hour)",
    choiceField: "vehicle",
    countField: "hours",
    onAdd: { chargeType: "hourly" },
    options: vehicleTypes,
    items: [
      { value: "jcb", step: 1, caption: "hours", image: "/photos/vehicles/jcb.webp" },
      { value: "hitachi", step: 1, caption: "hours", image: "/photos/vehicles/hitachi.webp" },
      { value: "crane", step: 1, caption: "hours", image: "/photos/vehicles/crane.webp" },
      { value: "truck", step: 1, caption: "hours", image: "/photos/vehicles/truck.webp" },
      { value: "tractor", step: 1, caption: "hours", image: "/photos/vehicles/tractor.webp" },
      { value: "mixer", step: 1, caption: "hours", image: "/photos/vehicles/mixer.webp" },
      { value: "roller", step: 1, caption: "hours", image: "/photos/vehicles/roller.webp" },
      { value: "tanker", step: 1, caption: "hours", image: "/photos/vehicles/tanker.webp" },
      { value: "other", step: 1, caption: "hours", image: "/photos/vehicles/other.webp" },
    ],
  },
} satisfies Record<string, Catalog>;

export type CatalogName = keyof typeof catalogs;

/** Adds one tap's step to a count, without floating-point noise or going below zero. */
export function stepCount(current: number, item: CatalogItem, direction: 1 | -1): number {
  return Math.max(0, Math.round((current + direction * item.step) * 1000) / 1000);
}
