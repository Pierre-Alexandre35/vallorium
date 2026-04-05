import { api } from "../../../lib/api";
import type { VillageOut } from "../types/village";

export async function listUserVillages() {
  const { data } = await api.get<VillageOut[]>("/villages/");
  return data;
}
