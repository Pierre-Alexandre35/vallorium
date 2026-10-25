import { useMutation, useQueryClient } from "@tanstack/react-query";

import { upgradeFarm } from "@/features/villages/api/upgrade-farm";
import type { VillageFarm } from "@/features/villages/types/village";

export function useUpgradeFarm(villageId: number) {
  const queryClient = useQueryClient();
  const farmsQueryKey = ["villages", villageId, "farms"] as const;

  return useMutation({
    mutationFn: (farmId: number) => upgradeFarm(villageId, farmId),
    onSuccess: async (result) => {
      // Prevent an older in-flight farms GET from overwriting the acknowledged
      // upgrade. The server will become authoritative again on the next GET.
      await queryClient.cancelQueries({ queryKey: farmsQueryKey });

      queryClient.setQueryData<VillageFarm[]>(farmsQueryKey, (farms) =>
        farms?.map((farm) =>
          farm.id === result.farm_id
            ? {
                ...farm,
                active_upgrade: {
                  upgrade_id: result.upgrade_id,
                  target_level: result.target_level,
                  // Backward-compatible for now, until the API provides the
                  // authoritative `completes_at` timestamp.
                  completes_at:
                    result.completes_at ??
                    new Date(
                      Date.now() + result.duration_seconds * 1000,
                    ).toISOString(),
                },
              }
            : farm,
        ),
      );

      // The backend already deducted resources when it accepted the upgrade.
      void queryClient.invalidateQueries({
        queryKey: ["dashboard", "current"],
      });
    },
  });
}
