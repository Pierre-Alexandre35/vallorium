import { api } from "../../../lib/api";
import type { VillageResourceOut } from "../types/village";

export async function getVillageResources(villageId: number) {
  const { data } = await api.get<VillageResourceOut>(
    `/villages/${villageId}/resources`,
  );
  return data;
}
