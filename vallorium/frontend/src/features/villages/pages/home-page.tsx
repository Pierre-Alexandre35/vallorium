import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { Alert, Box, Container, IconButton, Skeleton, Stack, Tooltip, Typography } from "@mui/material";

import { ResourceBar } from "@/features/villages/components/resource-bar";
import { VillageFieldMap } from "@/features/villages/components/village-field-map";
import { VillageSidebar } from "@/features/villages/components/village-sidebar";
import { VillageStatusPanel } from "@/features/villages/components/village-status-panel";
import { demoVillages } from "@/features/villages/data/demo-village";
import { useHomeData } from "@/features/villages/hooks/use-home-data";
import { gameTokens } from "@/theme";

export function HomePage() {
  const query = useHomeData();
  const villages = query.data?.length ? query.data : demoVillages;
  const village = villages[0];

  return (
    <Container maxWidth={false} sx={{ maxWidth: gameTokens.layout.contentMaxWidth, pt: { xs: 2, md: 3 } }}>
      {query.isError ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          The API is unavailable, so the dashboard is showing preview data. Retry after starting the FastAPI server.
        </Alert>
      ) : null}

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          {query.isLoading ? (
            <>
              <Skeleton width={180} height={38} />
              <Skeleton width={125} />
            </>
          ) : (
            <>
              <Typography variant="h4">{village.name}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.35 }}>
                Capital village · Roman Empire
              </Typography>
            </>
          )}
        </Box>
        <Tooltip title="Refresh village data">
          <IconButton onClick={() => query.refetch()} aria-label="Refresh village data">
            <RefreshRoundedIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <ResourceBar village={village} />

      <Box
        sx={{
          mt: 2,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "220px minmax(0, 1fr) 310px" },
          gap: 2,
          alignItems: "start",
        }}
      >
        <Box sx={{ display: { xs: "none", lg: "block" } }}>
          <VillageSidebar village={village} />
        </Box>
        <VillageFieldMap />
        <VillageStatusPanel village={village} />
      </Box>
    </Container>
  );
}
