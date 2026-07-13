import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export function LoginPage() {
  return (
    <AuthPageShell desktopColumns="1.08fr .92fr" formPadding={{ xs: 3.5, sm: 6, md: 7 }}>
      <LoginForm />
    </AuthPageShell>
  );
}
