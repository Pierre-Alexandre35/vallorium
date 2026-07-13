import {
  DEMO_WORLD_SIZE,
  RESOURCE_LAYOUT_SEED,
} from "@/features/world-map/data/resource-layout-seed";
import type {
  MapBounds,
  ResourceLayoutCode,
  TerrainType,
  TileOccupant,
  WorldMapResponse,
  WorldMapTile,
} from "@/features/world-map/types/map";

const layoutBySeedCharacter: Record<string, ResourceLayoutCode> = {
  A: "4-4-4-6",
  B: "5-4-4-5",
  C: "4-5-4-5",
  D: "4-4-5-5",
  E: "3-3-3-9",
  F: "1-1-1-15",
};

const namedVillages: Array<{ x: number; y: number; occupant: TileOccupant }> = [
  {
    x: 0,
    y: 0,
    occupant: {
      type: "village",
      id: 1,
      name: "Aurelia",
      ownerName: "Marcus Aurelius",
      allianceTag: "VLR",
      population: 128,
      isCurrentPlayer: true,
    },
  },
  {
    x: -7,
    y: 5,
    occupant: {
      type: "village",
      id: 2,
      name: "Northwatch",
      ownerName: "Cassia",
      allianceTag: "VLR",
      population: 84,
    },
  },
  {
    x: 8,
    y: -6,
    occupant: {
      type: "village",
      id: 3,
      name: "Red Hollow",
      ownerName: "Titus",
      allianceTag: "SPQR",
      population: 211,
    },
  },
  {
    x: 13,
    y: 9,
    occupant: {
      type: "village",
      id: 4,
      name: "Silver Ford",
      ownerName: "Livia",
      population: 63,
    },
  },
  {
    x: -14,
    y: -10,
    occupant: {
      type: "oasis",
      id: 8,
      name: "Wild grain oasis",
    },
  },
  {
    x: 5,
    y: 14,
    occupant: {
      type: "oasis",
      id: 9,
      name: "Forest oasis",
    },
  },
];

function hashCoordinates(x: number, y: number, salt = 0): number {
  let value = Math.imul(x + 1013 + salt, 374761393) + Math.imul(y - 947, 668265263);
  value = (value ^ (value >>> 13)) >>> 0;
  value = Math.imul(value, 1274126177) >>> 0;
  return (value ^ (value >>> 16)) >>> 0;
}

function getSeedIndex(x: number, y: number): number {
  const half = DEMO_WORLD_SIZE / 2;
  const column = ((x + half) % DEMO_WORLD_SIZE + DEMO_WORLD_SIZE) % DEMO_WORLD_SIZE;
  const row = ((y + half) % DEMO_WORLD_SIZE + DEMO_WORLD_SIZE) % DEMO_WORLD_SIZE;
  return row * DEMO_WORLD_SIZE + column;
}

function getTerrain(x: number, y: number): TerrainType {
  const roll = hashCoordinates(x, y) % 100;

  if (roll < 10) return "forest";
  if (roll < 16) return "mountain";
  if (roll < 21) return "lake";
  if (roll < 25) return "clay";
  if (roll < 29) return "iron";
  return "meadow";
}

function getOccupant(x: number, y: number): TileOccupant | null {
  const named = namedVillages.find((entry) => entry.x === x && entry.y === y);
  if (named) return named.occupant;

  const roll = hashCoordinates(x, y, 19) % 251;
  if (roll !== 0) return null;

  return {
    type: "village",
    id: 10_000 + hashCoordinates(x, y, 23),
    name: `Outpost ${Math.abs(x)}-${Math.abs(y)}`,
    ownerName: ["Valeria", "Decimus", "Sabina", "Lucius"][hashCoordinates(x, y, 29) % 4],
    population: 35 + (hashCoordinates(x, y, 31) % 280),
  };
}

function createTile(x: number, y: number): WorldMapTile {
  const index = getSeedIndex(x, y);
  const seedCharacter = RESOURCE_LAYOUT_SEED[index] ?? "A";

  return {
    id: index + 1,
    x,
    y,
    terrain: getTerrain(x, y),
    resourceLayout: layoutBySeedCharacter[seedCharacter] ?? "4-4-4-6",
    visualVariant: hashCoordinates(x, y, 7) % 4,
    occupant: getOccupant(x, y),
  };
}

export function createDemoWorldMap(bounds: MapBounds, worldId = 1): WorldMapResponse {
  const tiles: WorldMapTile[] = [];

  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      tiles.push(createTile(x, y));
    }
  }

  return { worldId, bounds, tiles };
}
