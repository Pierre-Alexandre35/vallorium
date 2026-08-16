import AlternateEmailRoundedIcon from "@mui/icons-material/AlternateEmailRounded";
import LockOutlineRoundedIcon from "@mui/icons-material/LockOutlineRounded";
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

import { useLoginForm } from "@/features/auth/hooks/use-login-form";
import { gameTokens } from "@/theme";

export function LoginForm() {
  const { values, error, isSubmitting, handleSubmit, updateField } = useLoginForm();

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.25}>
        <Box sx={{ mb: 0.5 }}>
          <Typography variant="h4">Welcome back, chief.</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Sign in to continue growing your realm.
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <TextField
          label="Email address"
          type="email"
          value={values.email}
          onChange={(event) => updateField("email", event.target.value)}
          autoComplete="username"
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
          autoComplete="current-password"
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
          {isSubmitting ? <CircularProgress size={23} color="inherit" /> : "Enter the realm"}
        </Button>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          New to Verdant Realms?{" "}
          <Typography
            component={RouterLink}
            to="/signup"
            color="primary.main"
            fontWeight={gameTokens.typography.weight.bold}
            sx={{ textDecoration: "none" }}
          >
            Create an account
          </Typography>
        </Typography>
      </Stack>
    </Box>
  );
}
