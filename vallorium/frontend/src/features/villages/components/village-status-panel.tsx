import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { Box, Button, Chip, Divider, LinearProgress, Stack, Typography } from "@mui/material";

import { GamePanel } from "@/components/ui/game-panel";
import { IconTile } from "@/components/ui/icon-tile";
import { ResourceIcon } from "@/features/villages/components/resource-icon";
import { resourceMeta } from "@/features/villages/components/resource-meta";
import type { ResourceKey, VillageRow } from "@/features/villages/types/village";
import { gameTokens } from "@/theme";

const resources: ResourceKey[] = ["wood", "clay", "iron", "crop"];

export function VillageStatusPanel({ village }: { village: VillageRow }) {
  return (
    <Stack spacing={2}>
      <GamePanel sx={{ p: 2.25 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6">Production</Typography>
            <Typography variant="body2" color="text.secondary">
              Per hour
            </Typography>
          </Box>
          <Chip label="Balanced" size="small" color="primary" variant="outlined" />
        </Stack>
        <Stack spacing={1.35} sx={{ mt: 2 }}>
          {resources.map((resource) => (
            <Stack key={resource} direction="row" alignItems="center" spacing={1.2}>
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

      <GamePanel sx={{ p: 2.25 }}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <IconTile
            color={gameTokens.colors.brand.amberDark}
            backgroundColor={gameTokens.colors.brand.amberLight}
          >
            <ConstructionRoundedIcon />
          </IconTile>
          <Box flex={1}>
            <Typography variant="h6">Build queue</Typography>
            <Typography variant="body2" color="text.secondary">
              1 construction active
            </Typography>
          </Box>
        </Stack>
        <Divider sx={{ my: 1.75 }} />
        <Typography fontWeight={gameTokens.typography.weight.heavy}>
          Iron mine · Level 7
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mt: 0.65 }}>
          <AccessTimeRoundedIcon sx={{ fontSize: 17, color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary">
            Finishes in 04:13
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={72}
          sx={{
            mt: 1.5,
            height: 7,
            borderRadius: gameTokens.radius.pill,
            bgcolor: "secondary.light",
            "& .MuiLinearProgress-bar": {
              bgcolor: "secondary.main",
              borderRadius: gameTokens.radius.pill,
            },
          }}
        />
        <Button
          fullWidth
          variant="outlined"
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{ mt: 1.75 }}
        >
          Open construction
        </Button>
      </GamePanel>

      <GamePanel sx={{ p: 2.25 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Troop movements</Typography>
          <Chip label="2 active" size="small" color="error" variant="outlined" />
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
