import { api } from "@/lib/api";

import type {
  AuthResponse,
  RegisterFormValues,
} from "@/features/auth/types/auth";

export async function register(values: RegisterFormValues) {
  const { data } = await api.post<AuthResponse>("/auth/signup", {
    email: values.email,
    password: values.password,
    tribe_id: values.tribeId,
  });

  return data;
}
