import { useQuery } from "@tanstack/react-query";

import { getCurrentDashboard } from "@/features/villages/api/get-current-dashboard";
import type {
  DashboardVillage,
  VillageRow,
} from "@/features/villages/types/village";

function toVillageRow(village: DashboardVillage): VillageRow {
  return {
    snapshot_at: village.snapshot_at,
    receivedAt: village.receivedAt,
    id: village.id,
    name: village.name,
    population: village.population,
    coordinates:
      village.x !== null && village.y !== null
        ? `${village.x}|${village.y}`
        : "—",
    production: village.production,
    resources: village.resources,
    capacities: village.capacities,
  };
}

export function useHomeData(currentVillageId: number | null | undefined) {
  return useQuery({
    queryKey: ["dashboard", "current", currentVillageId],
    queryFn: ({ signal }) => getCurrentDashboard(signal),
    enabled: currentVillageId != null,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    select: (dashboard) => ({
      village: dashboard.village ? toVillageRow(dashboard.village) : null,
    }),
  });
}
