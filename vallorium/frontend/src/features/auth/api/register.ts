import { api } from "@/lib/api";

import type { AuthResponse, RegisterRequest } from "@/features/auth/types/auth";

export async function register(
  values: RegisterRequest,
  idempotencyKey: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>(
    "/auth/signup",
    {
      email: values.email,
      password: values.password,
      tribe_id: values.tribeId,
    },
    {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    },
  );

  return data;
}
