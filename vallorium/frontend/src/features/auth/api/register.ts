import { api } from "@/lib/api";

import type { RegisterRequest } from "@/features/auth/types/auth";

export async function register(
  values: RegisterRequest,
  idempotencyKey: string,
) {
  const { data } = await api.post(
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
