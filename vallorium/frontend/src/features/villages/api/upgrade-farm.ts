import { api } from "@/api/client";

import type { FarmUpgrade } from "@/features/villages/types/village";

export async function upgradeFarm(
  villageId: number,
  farmId: number,
): Promise<FarmUpgrade> {
  const { data } = await api.post<FarmUpgrade>(
    `/villages/${villageId}/farms/${farmId}/upgrade`,
  );

  return data;
}