import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { Box, Chip, Stack, Typography } from "@mui/material";

import { GamePanel } from "@/components/ui/game-panel";
import { IconTile } from "@/components/ui/icon-tile";
import { ResourceIcon } from "@/features/villages/components/resources/resource-icon";
import { VillageBuildQueue } from "@/features/villages/components/construction/village-build-queue";
import {
  resourceKeys,
  resourceMeta,
} from "@/features/villages/config/resource-meta";
import type { VillageRow } from "@/features/villages/types/village";
import { gameTokens } from "@/theme";

export function VillageStatusPanel({ village }: { village: VillageRow }) {
  return (
    <Stack spacing={2}>
      <GamePanel sx={{ p: 2.25 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h6">Production</Typography>
            <Typography variant="body2" color="text.secondary">
              Per hour
            </Typography>
          </Box>
          <Chip
            label="Balanced"
            size="small"
            color="primary"
            variant="outlined"
          />
        </Stack>
        <Stack spacing={1.35} sx={{ mt: 2 }}>
          {resourceKeys.map((resource) => (
            <Stack
              key={resource}
              direction="row"
              alignItems="center"
              spacing={1.2}
            >
              <ResourceIcon resource={resource} size={34} soft />
              <Typography variant="body2" color="text.secondary" flex={1}>
                {resourceMeta[resource].label}
              </Typography>
              <Typography fontWeight={gameTokens.typography.weight.heavy}>
                +{village.production[resource] ?? 0}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </GamePanel>

      <VillageBuildQueue villageId={village.id} />

      <GamePanel sx={{ p: 2.25 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6">Troop movements</Typography>
          <Chip
            label="2 active"
            size="small"
            color="error"
            variant="outlined"
          />
        </Stack>
        <Stack spacing={1.5} sx={{ mt: 1.75 }}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <IconTile
              color={gameTokens.colors.danger}
              backgroundColor={gameTokens.colors.overlay.danger10}
            >
              <ShieldRoundedIcon />
            </IconTile>
            <Box flex={1}>
              <Typography fontWeight={gameTokens.typography.weight.bold}>
                Incoming attack
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Arrives in 41:13
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <IconTile
              color={gameTokens.colors.brand.forest}
              backgroundColor={gameTokens.colors.overlay.transparent}
            >
              <GroupsRoundedIcon />
            </IconTile>
            <Box flex={1}>
              <Typography fontWeight={gameTokens.typography.weight.bold}>
                Raid returning
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Returns in 18:42
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </GamePanel>
    </Stack>
  );
}
