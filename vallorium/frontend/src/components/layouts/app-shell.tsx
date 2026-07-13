import type { PropsWithChildren } from "react";
import { Box, Container, Paper, Typography } from "@mui/material";

import { gameTokens } from "@/theme";

interface AppShellProps extends PropsWithChildren {
  title: string;
}

export function AppShell({ title, children }: AppShellProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        bgcolor: gameTokens.colors.surface.neutral,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
          <Typography variant="h4" fontWeight={gameTokens.typography.weight.medium} gutterBottom>
            {title}
          </Typography>
          {children}
        </Paper>
      </Container>
    </Box>
  );
}
