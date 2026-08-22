import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateVillageName } from "@/features/villages/api/update-village-name";
import type { VillageNameUpdate } from "@/features/villages/types/village";

export function useUpdateVillageName(villageId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: VillageNameUpdate) =>
      updateVillageName(villageId, values),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "overview"],
      });
    },
  });
}
