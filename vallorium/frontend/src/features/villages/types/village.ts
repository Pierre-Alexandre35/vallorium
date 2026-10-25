export type ResourceKey = "wood" | "clay" | "iron" | "crop";

export type ResourceMap = Record<ResourceKey, number>;

export type DashboardVillage = {
  snapshot_at: string;
  receivedAt: number;
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
  snapshot_at: string;
  receivedAt: number;
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

/**
 * Only active upgrades are included. `completes_at` must be an ISO-8601
 * timestamp with a timezone, supplied by the server.
 */
export type ActiveFarmUpgrade = {
  upgrade_id: number;
  target_level: number;
  completes_at: string;
};

export type VillageFarm = {
  id: number;
  farm_number: number;
  level: number;
  resource_type: {
    name: string;
  };
  /** The backend must return this field for refresh-safe construction state. */
  active_upgrade?: ActiveFarmUpgrade | null;
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
  /** New response field: the authoritative construction deadline. */
  completes_at?: string;
};
