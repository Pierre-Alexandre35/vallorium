export type ResourceKey = "wood" | "clay" | "iron" | "crop";

export type ResourceMap = Record<ResourceKey, number>;

export type DashboardUser = {
  id: number;
  email: string;
  tribe_id: number;
  tribe_name: string;
  is_superuser: boolean;
};

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

export type DashboardOverview = {
  user: DashboardUser;
  villages: DashboardVillage[];
  totals: {
    villages: number;
    population: number;
    production: ResourceMap;
    resources: ResourceMap;
  };
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
