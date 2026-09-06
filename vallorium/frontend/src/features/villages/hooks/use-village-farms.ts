import { useQuery } from "@tanstack/react-query";

import { getVillageFarms } from "@/features/villages/api/get-village-farms";

export function useVillageFarms(villageId: number | null | undefined) {
  return useQuery({
    queryKey: ["villages", villageId, "farms"],
    queryFn: ({ signal }) => getVillageFarms(villageId!, signal),
    enabled: villageId != null,
  });
}
