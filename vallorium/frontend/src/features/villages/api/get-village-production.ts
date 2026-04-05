import { api } from "../../../lib/api";
import type { VillageProductionOut } from "../types/village";

export async function getVillageProduction(villageId: number) {
  const { data } = await api.get<VillageProductionOut>(
    `/villages/${villageId}/production`,
  );
  return data;
}
