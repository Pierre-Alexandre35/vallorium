import { api } from "@/lib/api";
import type {
  MapBounds,
  ResourceLayoutCode,
  TerrainType,
  TileOccupant,
  WorldMapResponse,
  WorldMapTile,
} from "@/features/world-map/types/map";

export type GetWorldMapTilesParams = MapBounds & {
  worldId: number;
};

type ApiOccupant = Partial<TileOccupant> & {
  owner_name?: string;
  alliance_tag?: string;
  is_current_player?: boolean;
};

type ApiTile = {
  id: number;
  x: number;
  y: number;
  terrain: TerrainType;
  resource_layout?: ResourceLayoutCode;
  resourceLayout?: ResourceLayoutCode;
  visual_variant?: number;
  visualVariant?: number;
  occupant?: ApiOccupant | null;
};

type ApiBounds = Partial<MapBounds> & {
  min_x?: number;
  max_x?: number;
  min_y?: number;
  max_y?: number;
};

type ApiWorldMapResponse = {
  world_id?: number;
  worldId?: number;
  bounds: ApiBounds;
  tiles: ApiTile[];
};

function normalizeOccupant(occupant: ApiOccupant | null | undefined): TileOccupant | null {
  if (!occupant?.type || occupant.id === undefined || !occupant.name) return null;

  return {
    type: occupant.type,
    id: occupant.id,
    name: occupant.name,
    ownerName: occupant.ownerName ?? occupant.owner_name,
    allianceTag: occupant.allianceTag ?? occupant.alliance_tag,
    population: occupant.population,
    isCurrentPlayer: occupant.isCurrentPlayer ?? occupant.is_current_player,
  };
}

function normalizeTile(tile: ApiTile): WorldMapTile {
  return {
    id: tile.id,
    x: tile.x,
    y: tile.y,
    terrain: tile.terrain,
    resourceLayout: tile.resourceLayout ?? tile.resource_layout ?? "4-4-4-6",
    visualVariant: tile.visualVariant ?? tile.visual_variant ?? 0,
    occupant: normalizeOccupant(tile.occupant),
  };
}

function normalizeBounds(bounds: ApiBounds, fallback: MapBounds): MapBounds {
  return {
    minX: bounds.minX ?? bounds.min_x ?? fallback.minX,
    maxX: bounds.maxX ?? bounds.max_x ?? fallback.maxX,
    minY: bounds.minY ?? bounds.min_y ?? fallback.minY,
    maxY: bounds.maxY ?? bounds.max_y ?? fallback.maxY,
  };
}

export async function getWorldMapTiles({
  worldId,
  minX,
  maxX,
  minY,
  maxY,
}: GetWorldMapTilesParams): Promise<WorldMapResponse> {
  const response = await api.get<ApiWorldMapResponse>(`/worlds/${worldId}/map/tiles`, {
    params: {
      min_x: minX,
      max_x: maxX,
      min_y: minY,
      max_y: maxY,
    },
  });

  const fallbackBounds = { minX, maxX, minY, maxY };

  return {
    worldId: response.data.worldId ?? response.data.world_id ?? worldId,
    bounds: normalizeBounds(response.data.bounds, fallbackBounds),
    tiles: response.data.tiles.map(normalizeTile),
  };
}
