import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateVillageName } from "@/features/villages/api/update-village-name";
import type {
  DashboardCurrent,
  VillageNameUpdate,
} from "@/features/villages/types/village";

export function useUpdateVillageName(villageId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: VillageNameUpdate) =>
      updateVillageName(villageId, values),

    onSuccess: (updatedVillage) => {
      queryClient.setQueryData<DashboardCurrent>(
        ["dashboard", "current", villageId],
        (current) => {
          if (!current?.village || current.village.id !== updatedVillage.id) {
            return current;
          }

          return {
            ...current,
            village: {
              ...current.village,
              name: updatedVillage.name,
            },
          };
        },
      );
    },
  });
}
