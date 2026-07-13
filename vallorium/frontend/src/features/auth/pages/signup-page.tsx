import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { SignupForm } from "@/features/auth/components/signup-form";

export function SignupPage() {
  return (
    <AuthPageShell desktopColumns="1.02fr .98fr" formPadding={{ xs: 3.5, sm: 6, md: 6 }}>
      <SignupForm />
    </AuthPageShell>
  );
}
