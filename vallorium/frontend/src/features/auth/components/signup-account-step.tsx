import AlternateEmailRoundedIcon from "@mui/icons-material/AlternateEmailRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LockOutlineRoundedIcon from "@mui/icons-material/LockOutlineRounded";
import { Button, InputAdornment, Stack, TextField } from "@mui/material";

import type { RegisterFormValues } from "@/features/auth/types/auth";

interface SignupAccountStepProps {
  values: Pick<
    RegisterFormValues,
    "email" | "password" | "confirmPassword"
  >;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
}

export function SignupAccountStep({
  values,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
}: SignupAccountStepProps) {
  return (
    <Stack spacing={2}>
      <TextField
        label="Email address"
        type="email"
        value={values.email}
        onChange={(event) => onEmailChange(event.target.value)}
        autoComplete="email"
        autoFocus
        required
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <AlternateEmailRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        label="Password"
        type="password"
        value={values.password}
        onChange={(event) => onPasswordChange(event.target.value)}
        autoComplete="new-password"
        required
        helperText="At least 8 characters"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlineRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        label="Confirm password"
        type="password"
        value={values.confirmPassword}
        onChange={(event) => onConfirmPasswordChange(event.target.value)}
        autoComplete="new-password"
        required
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlineRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        endIcon={<ArrowForwardRoundedIcon />}
      >
        Continue
      </Button>
    </Stack>
  );
}
