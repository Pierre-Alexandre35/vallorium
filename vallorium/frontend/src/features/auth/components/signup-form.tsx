import AlternateEmailRoundedIcon from "@mui/icons-material/AlternateEmailRounded";
import LockOutlineRoundedIcon from "@mui/icons-material/LockOutlineRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import { useSignupForm } from "@/features/auth/hooks/use-signup-form";
import { gameTokens } from "@/theme";

export function SignupForm() {
  const { values, error, isSubmitting, handleSubmit, updateField } = useSignupForm();

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2}>
        <Box sx={{ mb: 0.5 }}>
          <Typography variant="h4">Found your first village.</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Create your account and begin with a protected settlement.
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <TextField
          label="Chief name"
          value={values.username}
          onChange={(event) => updateField("username", event.target.value)}
          autoComplete="nickname"
          required
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          label="Email address"
          type="email"
          value={values.email}
          onChange={(event) => updateField("email", event.target.value)}
          autoComplete="email"
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
          onChange={(event) => updateField("password", event.target.value)}
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
          onChange={(event) => updateField("confirmPassword", event.target.value)}
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

        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          {isSubmitting ? <CircularProgress size={23} color="inherit" /> : "Create my village"}
        </Button>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          Already have an account?{" "}
          <Typography
            component={RouterLink}
            to="/login"
            color="primary.main"
            fontWeight={gameTokens.typography.weight.bold}
            sx={{ textDecoration: "none" }}
          >
            Sign in
          </Typography>
        </Typography>
      </Stack>
    </Box>
  );
}
