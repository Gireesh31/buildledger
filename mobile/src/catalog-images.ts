// The material and vehicle pictures (Canva AI photos on white, 600x450 webp), bundled with the app so they show instantly.
// Keyed by the website path used in src/lib/catalogs.ts.
import type { ImageSourcePropType } from "react-native";

export const catalogImages: Record<string, ImageSourcePropType> = {
  "/photos/materials/aggregate.webp": require("../assets/catalog/materials/aggregate.webp"),
  "/photos/materials/bricks.webp": require("../assets/catalog/materials/bricks.webp"),
  "/photos/materials/cement.webp": require("../assets/catalog/materials/cement.webp"),
  "/photos/materials/electrical.webp": require("../assets/catalog/materials/electrical.webp"),
  "/photos/materials/other.webp": require("../assets/catalog/materials/other.webp"),
  "/photos/materials/paint.webp": require("../assets/catalog/materials/paint.webp"),
  "/photos/materials/plumbing.webp": require("../assets/catalog/materials/plumbing.webp"),
  "/photos/materials/sand.webp": require("../assets/catalog/materials/sand.webp"),
  "/photos/materials/steel.webp": require("../assets/catalog/materials/steel.webp"),
  "/photos/materials/tiles.webp": require("../assets/catalog/materials/tiles.webp"),
  "/photos/materials/wood.webp": require("../assets/catalog/materials/wood.webp"),
  "/photos/vehicles/crane.webp": require("../assets/catalog/vehicles/crane.webp"),
  "/photos/vehicles/hitachi.webp": require("../assets/catalog/vehicles/hitachi.webp"),
  "/photos/vehicles/jcb.webp": require("../assets/catalog/vehicles/jcb.webp"),
  "/photos/vehicles/mixer.webp": require("../assets/catalog/vehicles/mixer.webp"),
  "/photos/vehicles/other.webp": require("../assets/catalog/vehicles/other.webp"),
  "/photos/vehicles/roller.webp": require("../assets/catalog/vehicles/roller.webp"),
  "/photos/vehicles/tanker.webp": require("../assets/catalog/vehicles/tanker.webp"),
  "/photos/vehicles/tractor.webp": require("../assets/catalog/vehicles/tractor.webp"),
  "/photos/vehicles/truck.webp": require("../assets/catalog/vehicles/truck.webp"),
};
