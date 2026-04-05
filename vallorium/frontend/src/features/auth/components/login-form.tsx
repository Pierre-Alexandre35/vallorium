import LockOutlineRoundedIcon from '@mui/icons-material/LockOutlineRounded';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useLoginForm } from '@/features/auth/hooks/use-login-form';

export function LoginForm() {
  const { values, error, isSubmitting, handleSubmit, updateField } = useLoginForm();

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Welcome back
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sign in with the account email and password used by your FastAPI backend.
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <TextField
          label="Email"
          type="email"
          value={values.email}
          onChange={(event) => updateField('email', event.target.value)}
          autoComplete="username"
          fullWidth
          required
        />

        <TextField
          label="Password"
          type="password"
          value={values.password}
          onChange={(event) => updateField('password', event.target.value)}
          autoComplete="current-password"
          fullWidth
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
          disabled={isSubmitting}
          sx={{ py: 1.4, borderRadius: 3 }}
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
        </Button>
      </Stack>
    </Box>
  );
}
