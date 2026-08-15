import type { TribeOption } from "@/features/auth/types/auth";
import { api } from "@/lib/api";

export async function getTribes(signal?: AbortSignal): Promise<TribeOption[]> {
  const { data } = await api.get<TribeOption[]>("/tribes", { signal });

  return data;
}
