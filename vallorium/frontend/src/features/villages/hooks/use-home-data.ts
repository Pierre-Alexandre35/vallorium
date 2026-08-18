import { useQuery } from "@tanstack/react-query";

import { getDashboardOverview } from "@/features/villages/api/get-dashboard-overview";
import type { DashboardOverview, VillageRow } from "@/features/villages/types/village";

function toVillageRow(village: DashboardOverview["villages"][number]): VillageRow {
  return {
    id: village.id,
    name: village.name,
    population: village.population,
    coordinates:
      village.x !== null && village.y !== null ? `${village.x}|${village.y}` : "—",
    production: village.production,
    resources: village.resources,
    capacities: village.capacities,
  };
}

export function useHomeData() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: ({ signal }) => getDashboardOverview(signal),
    select: (overview) => ({
      ...overview,
      villages: overview.villages.map(toVillageRow),
    }),
  });
}
