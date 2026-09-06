import { useMutation } from "@tanstack/react-query";

import { upgradeFarm } from "@/features/villages/api/upgrade-farm";

export function useUpgradeFarm(villageId: number) {
  return useMutation({
    mutationFn: (farmId: number) => upgradeFarm(villageId, farmId),
  });
}
