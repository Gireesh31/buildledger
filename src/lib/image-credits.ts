/**
 * The material and vehicle pictures on the picker cards. They were generated with Canva AI for
 * BuildLedger (no outside photographers to credit); the /credits page lists them.
 */
export interface ImageCredit {
  image: string;
  title: string;
}

const materials = ["cement", "steel", "sand", "aggregate", "bricks", "wood", "electrical", "plumbing", "paint", "tiles", "other"];
const vehicles = ["jcb", "hitachi", "crane", "truck", "tractor", "mixer", "roller", "tanker", "other"];

const titles: Record<string, string> = {
  "materials/cement": "Cement bag",
  "materials/steel": "Steel TMT bars",
  "materials/sand": "Sand",
  "materials/aggregate": "Aggregate (jelly)",
  "materials/bricks": "Bricks",
  "materials/wood": "Wood and plywood",
  "materials/electrical": "Electrical: wire, switch, breaker",
  "materials/plumbing": "Plumbing: pipes and tap",
  "materials/paint": "Paint bucket and roller",
  "materials/tiles": "Tiles and granite",
  "materials/other": "Other materials",
  "vehicles/jcb": "Backhoe loader (JCB)",
  "vehicles/hitachi": "Excavator (Hitachi)",
  "vehicles/crane": "Mobile crane",
  "vehicles/truck": "Tipper truck",
  "vehicles/tractor": "Tractor with trailer",
  "vehicles/mixer": "Concrete mixer truck",
  "vehicles/roller": "Road roller",
  "vehicles/tanker": "Water tanker",
  "vehicles/other": "Other vehicles",
};

export const imageCredits: ImageCredit[] = [
  ...materials.map((name) => ({ image: `/photos/materials/${name}.webp`, title: titles[`materials/${name}`] })),
  ...vehicles.map((name) => ({ image: `/photos/vehicles/${name}.webp`, title: titles[`vehicles/${name}`] })),
];
