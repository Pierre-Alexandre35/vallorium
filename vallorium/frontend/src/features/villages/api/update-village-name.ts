import { api } from "@/lib/api";
import type {
  Village,
  VillageNameUpdate,
} from "@/features/villages/types/village";

export async function updateVillageName(
  villageId: number,
  values: VillageNameUpdate,
): Promise<Village> {
  const { data } = await api.patch<Village>(
    `/villages/${villageId}`,
    values,
  );

  return data;
}