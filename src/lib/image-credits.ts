/**
 * Photos used on the material and vehicle picker cards, from Wikimedia Commons.
 * Their licences ask for credit, which the /credits page shows.
 */
export interface ImageCredit {
  image: string;
  title: string;
  /** Empty when Commons doesn't record an author; the source page says more. */
  artist: string;
  license: string;
  licenseUrl: string;
  source: string;
}

export const imageCredits: ImageCredit[] = [
  {
    "image": "/photos/materials/cement.webp",
    "title": "Portland cement CEM I 42,5 R (bag)",
    "artist": "Krugerr",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Portland_cement_CEM_I_42,5_R_(bag).jpg"
  },
  {
    "image": "/photos/materials/steel.webp",
    "title": "Buger Brücke Neubau Armierungseisen HRS-20240310-RM-151311",
    "artist": "Reinhold Möller Ermell",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Buger_Br%C3%BCcke_Neubau_Armierungseisen_HRS-20240310-RM-151311.jpg"
  },
  {
    "image": "/photos/materials/sand.webp",
    "title": "Pile of Sand for Building in Anambra State",
    "artist": "Johnnybam",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Pile_of_Sand_for_Building_in_Anambra_State.jpg"
  },
  {
    "image": "/photos/materials/aggregate.webp",
    "title": "Heap of crushed brownish grey rocks",
    "artist": "Johnnybam",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Heap_of_crushed_brownish_grey_rocks.jpg"
  },
  {
    "image": "/photos/materials/bricks.webp",
    "title": "Stacks of red bricks and concrete blocks at a construction site during the day in an urban environment",
    "artist": "Shixart1985",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "source": "https://commons.wikimedia.org/wiki/File:Stacks_of_red_bricks_and_concrete_blocks_at_a_construction_site_during_the_day_in_an_urban_environment.jpg"
  },
  {
    "image": "/photos/materials/wood.webp",
    "title": "Stack of wooden planks - close-up 02",
    "artist": "David r jenkins",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Stack_of_wooden_planks_-_close-up_02.jpg"
  },
  {
    "image": "/photos/materials/electrical.webp",
    "title": "Switches mains sockets in Denmark",
    "artist": "Nakonana",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Switches_mains_sockets_in_Denmark.jpg"
  },
  {
    "image": "/photos/materials/electrical.webp",
    "title": "Copper-clad aluminum (CCA) coiled wire",
    "artist": "Pavlo Polishchuk",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Copper-clad_aluminum_(CCA)_coiled_wire.png"
  },
  {
    "image": "/photos/materials/electrical.webp",
    "title": "MCB GV2ME08",
    "artist": "No machine-readable author provided. Fluppe37 assumed (based on copyright claims).",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "source": "https://commons.wikimedia.org/wiki/File:MCB_GV2ME08.jpg"
  },
  {
    "image": "/photos/materials/plumbing.webp",
    "title": "Kupferfittings 4062",
    "artist": "Torsten Bätge",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "http://creativecommons.org/licenses/by-sa/3.0/",
    "source": "https://commons.wikimedia.org/wiki/File:Kupferfittings_4062.jpg"
  },
  {
    "image": "/photos/materials/paint.webp",
    "title": "01 Plastic Paint Bucket Mock-Up",
    "artist": "Voutsas N",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:01_Plastic_Paint_Bucket_Mock-Up.jpg"
  },
  {
    "image": "/photos/materials/tiles.webp",
    "title": "Ceramic tiles 02",
    "artist": "Houss 2020",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "source": "https://commons.wikimedia.org/wiki/File:Ceramic_tiles_02.jpg"
  },
  {
    "image": "/photos/materials/other.webp",
    "title": "Vehicle - Diergaarde Blijdorp - Rotterdam - Wheelbarrow - grey",
    "artist": "AgainErick",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Vehicle_-_Diergaarde_Blijdorp_-_Rotterdam_-_Wheelbarrow_-_grey.jpg"
  },
  {
    "image": "/photos/vehicles/jcb.webp",
    "title": "JCB 3CX backhoe loader",
    "artist": "Andrey Butko",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "source": "https://commons.wikimedia.org/wiki/File:JCB_3CX_backhoe_loader.jpg"
  },
  {
    "image": "/photos/vehicles/hitachi.webp",
    "title": "Hitachi ZAXIS 140W graafmachine 05-04-2020 (d.j.b.) 01",
    "artist": "Dominicus Johannes Bergsma",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Hitachi_ZAXIS_140W_graafmachine_05-04-2020_(d.j.b.)_01.jpg"
  },
  {
    "image": "/photos/vehicles/crane.webp",
    "title": "The mount of the PoET telescope (eso2605b)",
    "artist": "ESO",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:The_mount_of_the_PoET_telescope_(eso2605b).jpg"
  },
  {
    "image": "/photos/vehicles/truck.webp",
    "title": "Mercedes-Benz Arocs - dump truck version (1)",
    "artist": "High Contrast",
    "license": "CC BY 3.0 de",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0/de/deed.en",
    "source": "https://commons.wikimedia.org/wiki/File:Mercedes-Benz_Arocs_-_dump_truck_version_(1).JPG"
  },
  {
    "image": "/photos/vehicles/tractor.webp",
    "title": "Mahindra 605 DI Tractor, Balur Ghat, Rajshahi (01)",
    "artist": "Moheen Reeyad",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Mahindra_605_DI_Tractor,_Balur_Ghat,_Rajshahi_(01).jpg"
  },
  {
    "image": "/photos/vehicles/mixer.webp",
    "title": "Mercedes-Benz Axor based cement mixer truck",
    "artist": "High Contrast",
    "license": "CC BY 3.0 de",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0/de/deed.en",
    "source": "https://commons.wikimedia.org/wiki/File:Mercedes-Benz_Axor_based_cement_mixer_truck.JPG"
  },
  {
    "image": "/photos/vehicles/roller.webp",
    "title": "Caterpillar CB54B roller on dirt lot in Campbell",
    "artist": "Grendelkhan",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Caterpillar_CB54B_roller_on_dirt_lot_in_Campbell.jpg"
  },
  {
    "image": "/photos/vehicles/tanker.webp",
    "title": "Water Supply Tanker, Elebu",
    "artist": "Ourlib",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "source": "https://commons.wikimedia.org/wiki/File:Water_Supply_Tanker,_Elebu.jpg"
  },
  {
    "image": "/photos/vehicles/other.webp",
    "title": "Caterpillar D6T Mississippi River project",
    "artist": "Marcus Qwertyus",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "source": "https://commons.wikimedia.org/wiki/File:Caterpillar_D6T_Mississippi_River_project.JPG"
  }
];
