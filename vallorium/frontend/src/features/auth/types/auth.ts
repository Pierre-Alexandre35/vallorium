export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  tribeId: number;
}

export interface AuthUser {
  id: number;
  email: string;
  is_superuser: boolean;
}

export interface AuthResponse {
  user: AuthUser;
}

export interface TribeOption {
  id: number;
  name: string;
}
