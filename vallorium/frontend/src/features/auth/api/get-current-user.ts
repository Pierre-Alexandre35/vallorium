import axios from "axios";

import type { AuthResponse, AuthUser } from "@/features/auth/types/auth";
import { api } from "@/api/client";

export async function getCurrentUser(signal?: AbortSignal): Promise<AuthUser | null> {
  try {
    const { data } = await api.get<AuthResponse>("/auth/me", { signal });

    return data.user;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }

    throw error;
  }
}
