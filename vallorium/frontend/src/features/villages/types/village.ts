export type ResourceKey = "wood" | "clay" | "iron" | "crop";

export type ResourceMap = Record<ResourceKey, number>;

export type DashboardVillage = {
  id: number;
  name: string;
  population: number;
  tile_id: number;
  x: number | null;
  y: number | null;
  production: ResourceMap;
  resources: ResourceMap;
  capacities: ResourceMap;
};

export type DashboardCurrent = {
  village: DashboardVillage | null;
};

export type VillageRow = {
  id: number;
  name: string;
  population: number;
  coordinates: string;
  production: ResourceMap;
  resources: ResourceMap;
  capacities: ResourceMap;
};

export type VillageNameUpdate = {
  name: string;
};

export type Village = {
  id: number;
  name: string;
  population: number;
  tile: {
    id: number;
    x: number;
    y: number;
    is_constructible: boolean;
  };
};

export type VillageFarm = {
  id: number;
  farm_number: number;
  level: number;
  resource_type: {
    name: string;
  };
};

export type FarmUpgrade = {
  upgrade_id: number;
  village_id: number;
  village_name: string;
  farm_id: number;
  farm_number: number;
  resource_type: string;
  current_level: number;
  target_level: number;
  status: string;
  duration_seconds: number;
};
