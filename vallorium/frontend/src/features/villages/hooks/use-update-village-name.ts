import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateVillageName } from "@/features/villages/api/update-village-name";
import type {
  DashboardOverview,
  VillageNameUpdate,
} from "@/features/villages/types/village";

export function useUpdateVillageName(villageId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: VillageNameUpdate) =>
      updateVillageName(villageId, values),

    onSuccess: (updatedVillage) => {
      queryClient.setQueryData<DashboardOverview>(
        ["dashboard", "overview"],
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            villages: current.villages.map((village) =>
              village.id === updatedVillage.id
                ? {
                    ...village,
                    name: updatedVillage.name,
                  }
                : village,
            ),
          };
        },
      );
    },
  });
}
