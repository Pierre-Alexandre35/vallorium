import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Box, IconButton, LinearProgress, Stack, Tooltip, Typography } from "@mui/material";

import { GamePanel } from "@/components/ui/game-panel";
import { ResourceIcon } from "@/features/villages/components/resource-icon";
import { resourceMeta } from "@/features/villages/components/resource-meta";
import { useLiveResources } from "@/features/villages/hooks/use-live-resources";
import type { ResourceKey, VillageRow } from "@/features/villages/types/village";
import { gameTokens } from "@/theme";

const resources: ResourceKey[] = ["wood", "clay", "iron", "crop"];

function formatAmount(value: number) {
  return Math.floor(value).toLocaleString();
}

export function ResourceBar({ village }: { village: VillageRow }) {
  const liveResources = useLiveResources(village);

  return (
    <GamePanel
      sx={{
        p: { xs: 1.25, sm: 1.5 },
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
        gap: 1,
        bgcolor: gameTokens.colors.overlay.paper92,
      }}
    >
      {resources.map((resource) => {
        const amount = liveResources[resource] ?? 0;
        const capacity = village.capacities[resource] ?? 1;
        const percent = Math.min(100, (amount / capacity) * 100);
        const meta = resourceMeta[resource];

        return (
          <Box
            key={resource}
            sx={{
              minWidth: 0,
              p: 1,
              display: "grid",
              gridTemplateColumns: "auto minmax(0, 1fr) auto",
              alignItems: "center",
              gap: 1,
              borderRadius: 2.5,
              "&:hover": { bgcolor: meta.light },
              transition: `background-color ${gameTokens.motion.quick}`,
            }}
          >
            <ResourceIcon resource={resource} size={36} />
            <Box minWidth={0}>
              <Stack direction="row" alignItems="baseline" spacing={0.4}>
                <Typography
                  fontWeight={gameTokens.typography.weight.heavy}
                  fontSize={14}
                  noWrap
                >
                  {formatAmount(amount)}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  / {formatAmount(capacity)}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={percent}
                sx={{
                  mt: 0.6,
                  height: 4,
                  borderRadius: gameTokens.radius.pill,
                  bgcolor: `${meta.color}1f`,
                  "& .MuiLinearProgress-bar": {
                    bgcolor: meta.color,
                    borderRadius: gameTokens.radius.pill,
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: meta.color, fontWeight: gameTokens.typography.weight.strong }}
              >
                +{formatAmount(village.production[resource] ?? 0)}/h
              </Typography>
            </Box>
            <Tooltip title={`Buy more ${meta.label.toLowerCase()}`}>
              <IconButton
                size="small"
                sx={{ width: 28, height: 28, bgcolor: gameTokens.colors.overlay.black035 }}
              >
                <AddRoundedIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      })}
    </GamePanel>
  );
}
