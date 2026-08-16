import { Alert, Box, Button, Stack } from "@mui/material";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { FullPageLoader } from "@/components/ui/full-page-loader";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";

export function ProtectedRoute() {
  const location = useLocation();
  const currentUser = useCurrentUser();

  if (currentUser.isPending) {
    return <FullPageLoader />;
  }

  if (currentUser.isError) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3 }}>
        <Stack spacing={2} sx={{ width: "100%", maxWidth: 480 }}>
          <Alert severity="error">
            We could not verify your session. Check your connection and try again.
          </Alert>
          <Button
            variant="contained"
            disabled={currentUser.isFetching}
            onClick={() => void currentUser.refetch()}
          >
            Try again
          </Button>
        </Stack>
      </Box>
    );
  }

  if (!currentUser.data) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
