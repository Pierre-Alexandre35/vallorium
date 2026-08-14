import { useEffect, useState } from "react";

import AlternateEmailRoundedIcon from "@mui/icons-material/AlternateEmailRounded";
import LockOutlineRoundedIcon from "@mui/icons-material/LockOutlineRounded";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { Link as RouterLink } from "react-router-dom";

import { getTribes, type TribeOption } from "@/features/auth/api/get-tribes";

import { useSignupForm } from "@/features/auth/hooks/use-signup-form";
import { gameTokens } from "@/theme";

export function SignupForm() {
  const { values, error, isSubmitting, handleSubmit, updateField } =
    useSignupForm();

  const [tribes, setTribes] = useState<TribeOption[]>([]);
  const [isLoadingTribes, setIsLoadingTribes] = useState(true);
  const [tribesError, setTribesError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTribes() {
      try {
        const data = await getTribes();

        if (active) {
          setTribes(data);
        }
      } catch {
        if (active) {
          setTribesError("Unable to load races.");
        }
      } finally {
        if (active) {
          setIsLoadingTribes(false);
        }
      }
    }

    loadTribes();

    return () => {
      active = false;
    };
  }, []);

  return (
    <Box sx={{ mb: 0.5 }}>
      <Stack component="form" onSubmit={handleSubmit} spacing={2}>
        <Typography variant="h4">Found your first village.</Typography>

        <Typography color="text.secondary">
          Create your account and begin with a protected settlement.
        </Typography>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {tribesError ? <Alert severity="error">{tribesError}</Alert> : null}

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
          onChange={(event) =>
            updateField("confirmPassword", event.target.value)
          }
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

        <TextField
          select
          label="Race"
          value={values.tribeId}
          onChange={(event) =>
            updateField("tribeId", Number(event.target.value))
          }
          required
          disabled={isLoadingTribes || tribes.length === 0}
          helperText={
            isLoadingTribes ? "Loading races..." : "Choose your starting race"
          }
        >
          {tribes.map((tribe) => (
            <MenuItem key={tribe.id} value={tribe.id}>
              {tribe.name}
            </MenuItem>
          ))}
        </TextField>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting || isLoadingTribes || !values.tribeId}
        >
          {isSubmitting ? (
            <CircularProgress size={23} color="inherit" />
          ) : (
            "Create my village"
          )}
        </Button>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          Already have an account?{" "}
          <Typography
            component={RouterLink}
            to="/login"
            color="primary.main"
            fontWeight={gameTokens.typography.weight.bold}
            sx={{
              textDecoration: "none",
            }}
          >
            Sign in
          </Typography>
        </Typography>
      </Stack>
    </Box>
  );
}
