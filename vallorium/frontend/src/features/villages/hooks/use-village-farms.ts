import { useQuery } from "@tanstack/react-query";

import { getVillageFarms } from "@/features/villages/api/get-village-farms";
import type { VillageFarm } from "@/features/villages/types/village";

export function useVillageFarms(villageId: number | null | undefined) {
  return useQuery({
    queryKey: ["villages", villageId, "farms"],
    queryFn: ({ signal }) => getVillageFarms(villageId!, signal),
    enabled: villageId != null,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    // No constant polling while construction is running. A single timer in
    // VillageFieldMap refreshes at the deadline. If backend settlement is
    // briefly delayed, retry the due construction at a modest interval.
    refetchInterval: (query) => {
      const farms = query.state.data as VillageFarm[] | undefined;
      const awaitingSettlement = farms?.some((farm) => {
        const expires = farm.active_upgrade?.completes_at;
        return expires != null && Date.parse(expires) <= Date.now();
      });
      return awaitingSettlement ? 5_000 : false;
    },
  });
}
