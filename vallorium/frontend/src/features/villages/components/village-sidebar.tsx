import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CastleRoundedIcon from "@mui/icons-material/CastleRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";

import { GamePanel } from "@/components/ui/game-panel";
import { IconTile } from "@/components/ui/icon-tile";
import type { VillageRow } from "@/features/villages/types/village";
import { gameShadows, gameTokens } from "@/theme";

export function VillageSidebar({ village }: { village: VillageRow }) {
  return (
    <Stack spacing={2}>
      <GamePanel sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography
            variant="overline"
            color="text.secondary"
            fontWeight={gameTokens.typography.weight.heavy}
          >
            Your villages
          </Typography>
          <Button size="small" sx={{ minWidth: 0, px: 1 }} aria-label="Add village">
            <AddRoundedIcon fontSize="small" />
          </Button>
        </Stack>

        <Box
          sx={{
            mt: 1.5,
            p: 1.5,
            borderRadius: 2.5,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            boxShadow: gameShadows.selectedVillage,
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <IconTile
              size={40}
              color="inherit"
              backgroundColor={gameTokens.colors.overlay.white14}
            >
              <CastleRoundedIcon />
            </IconTile>
            <Box minWidth={0} flex={1}>
              <Typography fontWeight={gameTokens.typography.weight.heavy} noWrap>
                {village.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: gameTokens.colors.overlay.white72 }}
              >
                Capital village
              </Typography>
            </Box>
            <ChevronRightRoundedIcon />
          </Stack>
        </Box>

        <Stack spacing={1.25} sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <LocationOnRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                Coordinates
              </Typography>
            </Stack>
            <Typography variant="body2" fontWeight={gameTokens.typography.weight.bold}>
              {village.coordinates}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <GroupRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                Population
              </Typography>
            </Stack>
            <Typography variant="body2" fontWeight={gameTokens.typography.weight.bold}>
              {village.population}
            </Typography>
          </Stack>
        </Stack>
      </GamePanel>

      <GamePanel sx={{ p: 2 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          fontWeight={gameTokens.typography.weight.heavy}
        >
          Protection
        </Typography>
        <Divider sx={{ my: 1.5 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography fontWeight={gameTokens.typography.weight.bold}>
              Beginner&apos;s protection
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ends in 2d 14h
            </Typography>
          </Box>
          <Chip label="Active" size="small" color="primary" />
        </Stack>
      </GamePanel>
    </Stack>
  );
}
