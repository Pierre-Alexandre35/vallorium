import { useQuery } from "@tanstack/react-query";

import { getWorldMapTiles } from "@/features/world-map/api/get-world-map-tiles";
import type { MapBounds } from "@/features/world-map/types/map";

export function useWorldMapData(worldId: number, bounds: MapBounds) {
  return useQuery({
    queryKey: ["world-map", worldId, bounds],
    queryFn: () => getWorldMapTiles({ worldId, ...bounds }),
  });
}
