import { api } from "@/api/client";

import type { DashboardCurrent } from "@/features/villages/types/village";

export async function getCurrentDashboard(signal?: AbortSignal) {
  const { data } = await api.get<DashboardCurrent>("/dashboard/current", { signal });
  return data;
}
