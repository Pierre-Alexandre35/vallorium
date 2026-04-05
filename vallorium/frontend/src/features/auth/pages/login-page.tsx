import { Box, Container, Grid, Paper, Typography } from '@mui/material';

import { LoginForm } from '@/features/auth/components/login-form';

export function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f5f7fb 0%, #e8eef9 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Paper elevation={0} sx={{ overflow: 'hidden', borderRadius: 6 }}>
          <Grid container>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ p: { xs: 4, md: 6 } }}>
                <LoginForm />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  height: '100%',
                  minHeight: 320,
                  p: { xs: 4, md: 6 },
                  color: 'common.white',
                  background: 'linear-gradient(160deg, #1e3a5f 0%, #2f5f8f 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="overline" sx={{ letterSpacing: 2 }}>
                  Travian Control Center
                </Typography>
                <Typography variant="h3" fontWeight={800} sx={{ mt: 1, mb: 2 }}>
                  Build faster with a clean auth foundation.
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  This starter keeps routing, API access, theming, and feature code separated so it can scale cleanly beyond the login page.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}
