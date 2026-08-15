import type {
  AuthResponse,
  RegisterRequest,
} from "@/features/auth/types/auth";
import { api } from "@/lib/api";

export async function register(values: RegisterRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/signup", {
    email: values.email,
    password: values.password,
    tribe_id: values.tribeId,
  });

  return data;
}
