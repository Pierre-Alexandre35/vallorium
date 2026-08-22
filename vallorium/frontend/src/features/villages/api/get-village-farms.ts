import { api } from "@/api/client";
import type { VillageFarm } from "@/features/villages/types/village";

export async function getVillageFarms(
  villageId: number,
  signal?: AbortSignal,
): Promise<VillageFarm[]> {
  const { data } = await api.get<VillageFarm[]>(
    `/villages/${villageId}/farms`,
    { signal },
  );

  return data;
}
