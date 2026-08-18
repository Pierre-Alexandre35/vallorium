import { api } from "@/lib/api";

import type { DashboardOverview } from "@/features/villages/types/village";

export async function getDashboardOverview(signal?: AbortSignal) {
  const { data } = await api.get<DashboardOverview>("/dashboard/overview", { signal });
  return data;
}
