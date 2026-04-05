import { useQuery } from "@tanstack/react-query";
import { getVillageProduction } from "../api/get-village-production";
import { getVillageResources } from "../api/get-village-resources";
import { listUserVillages } from "../api/list-user-villages";
import type { VillageRow } from "../types/village";

function toRecord<T extends { resource_type: string }>(
  items: T[],
  getValue: (item: T) => number,
) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.resource_type.toLowerCase()] = getValue(item);
    return acc;
  }, {});
}

export function useHomeData() {
  return useQuery({
    queryKey: ["home-data"],
    queryFn: async (): Promise<VillageRow[]> => {
      const villages = await listUserVillages();

      const rows = await Promise.all(
        villages.map(async (village) => {
          const [productionData, resourceData] = await Promise.all([
            getVillageProduction(village.id),
            getVillageResources(village.id),
          ]);

          return {
            id: village.id,
            name: village.name,
            population: village.population,
            coordinates:
              village.tile?.x !== undefined && village.tile?.y !== undefined
                ? `${village.tile.x}|${village.tile.y}`
                : "-",
            production: toRecord(
              productionData.production,
              (item) => item.amount_per_hour,
            ),
            resources: toRecord(resourceData.resources, (item) => item.amount),
          };
        }),
      );

      return rows;
    },
  });
}
