import { api } from "@/lib/api";

import type { TribeOption } from "@/features/auth/types/auth";

export async function getTribes() {
  const { data } = await api.get<TribeOption[]>("/tribes");

  return data;
}
