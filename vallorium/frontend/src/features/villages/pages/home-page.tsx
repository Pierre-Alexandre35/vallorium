import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { ResourceBar } from "@/features/villages/components/resources/resource-bar";
import { VillageFieldMap } from "@/features/villages/components/fields/village-field-map";
import { VillageSidebar } from "@/features/villages/components/village-sidebar";
import { VillageStatusPanel } from "@/features/villages/components/village-status-panel";
import { EditableVillageName } from "@/features/villages/components/editable-village-name";
import { useHomeData } from "@/features/villages/hooks/use-home-data";
import { gameTokens } from "@/theme";

export function HomePage() {
  const query = useHomeData();

  if (query.isError) {
    return (
      <Container
        maxWidth={false}
        sx={{ maxWidth: gameTokens.layout.contentMaxWidth, pt: { xs: 2, md: 3 } }}
      >
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Retry
            </Button>
          }
        >
          Unable to load your village dashboard.
        </Alert>
      </Container>
    );
  }

  if (query.isPending) {
    return (
      <Container
        maxWidth={false}
        sx={{ maxWidth: gameTokens.layout.contentMaxWidth, pt: { xs: 2, md: 3 } }}
      >
        <Stack spacing={2}>
          <Box>
            <Skeleton width={180} height={38} />
            <Skeleton width={125} />
          </Box>
          <Skeleton variant="rounded" height={110} />
          <Skeleton variant="rounded" height={420} />
        </Stack>
      </Container>
    );
  }

  const village = query.data.villages[0];

  if (!village) {
    return (
      <Container
        maxWidth={false}
        sx={{ maxWidth: gameTokens.layout.contentMaxWidth, pt: { xs: 2, md: 3 } }}
      >
        <Alert severity="info">No villages are available for this account yet.</Alert>
      </Container>
    );
  }

  return (
    <Container
      maxWidth={false}
      sx={{ maxWidth: gameTokens.layout.contentMaxWidth, pt: { xs: 2, md: 3 } }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <EditableVillageName
            villageId={village.id}
            name={village.name}
          />
          <Typography color="text.secondary" sx={{ mt: 0.35 }}>
            {query.data.user.tribe_name} village
          </Typography>
        </Box>
        <Tooltip title="Refresh village data">
          <IconButton
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            aria-label="Refresh village data"
          >
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
        <VillageFieldMap villageId={village.id} />
        <VillageStatusPanel village={village} />
      </Box>
    </Container>
  );
}
