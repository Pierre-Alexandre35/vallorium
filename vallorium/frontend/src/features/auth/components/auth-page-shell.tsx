import { Box, Container, Paper } from "@mui/material";
import type { PropsWithChildren } from "react";

import { AuthVisual } from "@/features/auth/components/auth-visual";
import { gameShadows } from "@/theme";

interface AuthPageShellProps extends PropsWithChildren {
  desktopColumns: string;
  formPadding: { xs: number; sm: number; md: number };
}

export function AuthPageShell({
  children,
  desktopColumns,
  formPadding,
}: AuthPageShellProps) {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", py: { xs: 0, md: 4 } }}>
      <Container maxWidth="lg" disableGutters sx={{ px: { xs: 0, md: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: desktopColumns },
            overflow: "hidden",
            borderRadius: { xs: 0, md: 4 },
            border: { xs: 0, md: "1px solid" },
            boxShadow: { xs: "none", md: gameShadows.authPanel },
          }}
        >
          <AuthVisual />
          <Box sx={{ p: formPadding, display: "grid", alignItems: "center" }}>{children}</Box>
        </Paper>
      </Container>
    </Box>
  );
}
