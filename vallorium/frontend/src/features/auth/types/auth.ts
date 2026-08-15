export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  tribeId: number | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
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

export interface TribeAdvantage {
  id: number;
  code: string;
  title: string;
  description: string | null;
  position: number;
}

export interface TribeOption {
  id: number;
  name: string;
  description: string | null;
  playstyle: string | null;
  advantages: TribeAdvantage[];
}
