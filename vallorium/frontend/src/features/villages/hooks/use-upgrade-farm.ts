import { useMutation, useQueryClient } from "@tanstack/react-query";

import { upgradeFarm } from "@/features/villages/api/upgrade-farm";

export function useUpgradeFarm(villageId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["dashboard", "current"] }),
    mutationFn: (farmId: number) => upgradeFarm(villageId, farmId),
  });
}
