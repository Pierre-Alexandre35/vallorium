import { api } from "@/api/client";

import type { AuthResponse, LoginFormValues } from "@/features/auth/types/auth";

export async function login(values: LoginFormValues) {
  const { data } = await api.post<AuthResponse>("/auth/login", {
    email: values.email,
    password: values.password,
  });

  return data;
}
