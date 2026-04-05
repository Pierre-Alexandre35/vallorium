import { api } from "@/lib/api";
import type {
  LoginFormValues,
  TokenResponse,
} from "@/features/auth/types/auth";

export async function login(values: LoginFormValues) {
  const body = new URLSearchParams({
    username: values.email,
    password: values.password,
  });

  const { data } = await api.post<TokenResponse>("/token", body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return data;
}
