import CastleRoundedIcon from "@mui/icons-material/CastleRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import GrassRoundedIcon from "@mui/icons-material/GrassRounded";
import LandscapeRoundedIcon from "@mui/icons-material/LandscapeRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import ParkRoundedIcon from "@mui/icons-material/ParkRounded";
import TerrainRoundedIcon from "@mui/icons-material/TerrainRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import {
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import { GamePanel } from "@/components/ui/game-panel";
import {
  RESOURCE_LAYOUT_VALUES,
  type TerrainType,
  type WorldMapTile,
} from "@/features/world-map/types/map";
import { gameTokens } from "@/theme";

const terrainLabels: Record<TerrainType, string> = {
  meadow: "Open meadow",
  forest: "Dense forest",
  mountain: "Mountain range",
  lake: "Freshwater lake",
  clay: "Clay basin",
  iron: "Iron ridge",
};

type TileDetailsPanelProps = {
  tile: WorldMapTile | null;
  onCenter: (tile: WorldMapTile) => void;
  onOpenVillage: () => void;
};

function ResourceAmount({
  label,
  amount,
  icon,
  color,
}: {
  label: string;
  amount: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ color, display: "grid", placeItems: "center" }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={gameTokens.typography.weight.bold}>
        {amount}
      </Typography>
    </Stack>
  );
}

export function TileDetailsPanel({
  tile,
  onCenter,
  onOpenVillage,
}: TileDetailsPanelProps) {
  if (!tile) {
    return (
      <GamePanel sx={{ p: 2.5, textAlign: "center" }}>
        <ExploreRoundedIcon sx={{ fontSize: 42, color: "text.disabled" }} />
        <Typography variant="h6" sx={{ mt: 1 }}>
          Select a tile
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Click any position on the map to inspect its terrain and resource fields.
        </Typography>
      </GamePanel>
    );
  }

  const layout = RESOURCE_LAYOUT_VALUES[tile.resourceLayout];
  const isBlocked = tile.terrain === "lake" || tile.terrain === "mountain";

  return (
    <GamePanel sx={{ overflow: "hidden" }}>
      <Box
        sx={{
          p: 2.25,
          background: `linear-gradient(135deg, ${gameTokens.colors.brand.forestSoft}, ${gameTokens.colors.surface.paper})`,
        }}
      >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="overline" color="primary.main">
              Selected tile
            </Typography>
            <Typography variant="h6" sx={{ mt: -0.3 }}>
              {tile.occupant?.name ?? terrainLabels[tile.terrain]}
            </Typography>
          </Box>
          <Chip
            size="small"
            icon={<LocationOnRoundedIcon />}
            label={`${tile.x} | ${tile.y}`}
            variant="outlined"
          />
        </Stack>
      </Box>

      <Box sx={{ p: 2.25 }}>
        <Stack spacing={1.25}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Terrain
            </Typography>
            <Typography variant="body2" fontWeight={gameTokens.typography.weight.bold}>
              {terrainLabels[tile.terrain]}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Resource layout
            </Typography>
            <Chip
              size="small"
              label={tile.resourceLayout}
              color={tile.resourceLayout === "1-1-1-15" ? "warning" : "default"}
            />
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
          Resource fields
        </Typography>
        <Stack spacing={1.1}>
          <ResourceAmount
            label="Wood"
            amount={layout.wood}
            icon={<ParkRoundedIcon fontSize="small" />}
            color={gameTokens.colors.resource.wood}
          />
          <ResourceAmount
            label="Clay"
            amount={layout.clay}
            icon={<LandscapeRoundedIcon fontSize="small" />}
            color={gameTokens.colors.resource.clay}
          />
          <ResourceAmount
            label="Iron"
            amount={layout.iron}
            icon={<ConstructionRoundedIcon fontSize="small" />}
            color={gameTokens.colors.resource.iron}
          />
          <ResourceAmount
            label="Crop"
            amount={layout.crop}
            icon={<GrassRoundedIcon fontSize="small" />}
            color={gameTokens.colors.resource.crop}
          />
        </Stack>

        {tile.occupant ? (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={0.75}>
              <Stack direction="row" spacing={1} alignItems="center">
                {tile.occupant.type === "village" ? (
                  <CastleRoundedIcon color="primary" fontSize="small" />
                ) : (
                  <TerrainRoundedIcon color="warning" fontSize="small" />
                )}
                <Typography variant="subtitle2">
                  {tile.occupant.type === "village" ? "Occupied village" : "Wild oasis"}
                </Typography>
              </Stack>
              {tile.occupant.ownerName ? (
                <Typography variant="body2" color="text.secondary">
                  Owner: {tile.occupant.ownerName}
                  {tile.occupant.allianceTag ? ` · [${tile.occupant.allianceTag}]` : ""}
                </Typography>
              ) : null}
              {tile.occupant.population ? (
                <Typography variant="body2" color="text.secondary">
                  Population: {tile.occupant.population}
                </Typography>
              ) : null}
            </Stack>
          </>
        ) : null}

        <Stack spacing={1} sx={{ mt: 2.25 }}>
          <Button variant="outlined" onClick={() => onCenter(tile)}>
            Center map here
          </Button>
          {tile.occupant?.isCurrentPlayer ? (
            <Button variant="contained" startIcon={<CastleRoundedIcon />} onClick={onOpenVillage}>
              Open village
            </Button>
          ) : (
            <Button variant="contained" disabled>
              {isBlocked
                ? "Uninhabitable terrain"
                : tile.occupant
                  ? "Tile occupied"
                  : "Connect settlement API"}
            </Button>
          )}
        </Stack>
      </Box>
    </GamePanel>
  );
}
