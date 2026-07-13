import { api } from "@/lib/api";
import type { RegisterFormValues } from "@/features/auth/types/auth";

export async function register(values: RegisterFormValues) {
  const { data } = await api.post("/users/register", {
    username: values.username,
    email: values.email,
    password: values.password,
  });

  return data;
}
