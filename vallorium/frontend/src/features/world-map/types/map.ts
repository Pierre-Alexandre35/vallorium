export type ResourceLayoutCode =
  | "4-4-4-6"
  | "5-4-4-5"
  | "4-5-4-5"
  | "4-4-5-5"
  | "3-3-3-9"
  | "1-1-1-15";

export type TerrainType =
  | "meadow"
  | "forest"
  | "mountain"
  | "lake"
  | "clay"
  | "iron";

export type TileOccupant = {
  type: "village" | "oasis";
  id: number;
  name: string;
  ownerName?: string;
  allianceTag?: string;
  population?: number;
  isCurrentPlayer?: boolean;
};

export type WorldMapTile = {
  id: number;
  x: number;
  y: number;
  terrain: TerrainType;
  resourceLayout: ResourceLayoutCode;
  visualVariant: number;
  occupant: TileOccupant | null;
};

export type MapBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type WorldMapResponse = {
  worldId: number;
  bounds: MapBounds;
  tiles: WorldMapTile[];
};

export const RESOURCE_LAYOUT_VALUES: Record<
  ResourceLayoutCode,
  { wood: number; clay: number; iron: number; crop: number }
> = {
  "4-4-4-6": { wood: 4, clay: 4, iron: 4, crop: 6 },
  "5-4-4-5": { wood: 5, clay: 4, iron: 4, crop: 5 },
  "4-5-4-5": { wood: 4, clay: 5, iron: 4, crop: 5 },
  "4-4-5-5": { wood: 4, clay: 4, iron: 5, crop: 5 },
  "3-3-3-9": { wood: 3, clay: 3, iron: 3, crop: 9 },
  "1-1-1-15": { wood: 1, clay: 1, iron: 1, crop: 15 },
};
