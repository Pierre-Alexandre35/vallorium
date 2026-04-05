import type { PropsWithChildren } from "react";
import { Box, Container, Paper, Typography } from "@mui/material";

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
        bgcolor: "grey.100",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {title}
          </Typography>
          {children}
        </Paper>
      </Container>
    </Box>
  );
}
