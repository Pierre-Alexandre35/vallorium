export type MapTileOut = {
  id: number;
  x?: number;
  y?: number;
};

export type VillageOut = {
  id: number;
  name: string;
  population: number;
  tile: MapTileOut;
};

export type ResourceProduction = {
  resource_type: string;
  amount_per_hour: number;
};

export type VillageProductionOut = {
  village_id: number;
  village_name: string;
  production: ResourceProduction[];
};

export type ResourceBalance = {
  resource_type: string;
  amount: number;
  capacity?: number;
};

export type VillageResourceOut = {
  village_id: number;
  village_name: string;
  resources: ResourceBalance[];
};

export type VillageRow = {
  id: number;
  name: string;
  population: number;
  coordinates: string;
  production: Record<string, number>;
  resources: Record<string, number>;
};
