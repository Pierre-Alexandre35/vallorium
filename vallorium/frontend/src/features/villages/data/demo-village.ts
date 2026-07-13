import type { VillageRow } from "@/features/villages/types/village";

export const demoVillages: VillageRow[] = [
  {
    id: 1,
    name: "Cartago",
    population: 314,
    coordinates: "12|−7",
    resources: { wood: 5177, clay: 4671, iron: 3365, crop: 3332 },
    capacities: { wood: 6300, clay: 6300, iron: 6300, crop: 5000 },
    production: { wood: 270, clay: 300, iron: 183, crop: 161 },
  },
];
