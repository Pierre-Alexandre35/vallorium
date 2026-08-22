import { api } from "@/lib/api";
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
