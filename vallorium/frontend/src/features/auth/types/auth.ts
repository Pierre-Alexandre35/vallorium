export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
