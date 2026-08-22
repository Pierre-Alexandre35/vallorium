import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import CastleRoundedIcon from "@mui/icons-material/CastleRounded";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useState } from "react";

import { GamePanel } from "@/components/ui/game-panel";
import {
  farmFieldLayout,
  getFarmFieldPosition,
} from "@/features/villages/components/fields/farm-field-layout";
import { FarmPlotButton } from "@/features/villages/components/fields/farm-plot-button";
import { FarmTerrain } from "@/features/villages/components/fields/farm-terrain";
import styles from "@/features/villages/components/fields/village-field-map.module.css";
import { ResourceIcon } from "@/features/villages/components/resources/resource-icon";
import { resourceMeta } from "@/features/villages/config/resource-meta";
import { useVillageFarms } from "@/features/villages/hooks/use-village-farms";
import type { ResourceKey } from "@/features/villages/types/village";
import {
  gameShadows,
  gameTokens,
  gameVisuals,
  type GameCssProperties,
} from "@/theme";

interface VillageFieldMapProps {
  villageId: number;
}

interface FieldPlot {
  id: number;
  farmNumber: number;
  resource: ResourceKey;
  level: number;
  left: string;
  top: string;
}

const mapVariables: GameCssProperties = {
  "--village-map-max-width": `${gameTokens.layout.villageMapMaxWidth}px`,
  "--village-map-border": gameVisuals.village.mapBorder,
  "--village-map-shadow": gameShadows.villageMap,
  "--village-center-color": gameTokens.colors.text.villageCenter,
  "--village-center-background": gameVisuals.village.centerBackground,
  "--village-center-border": gameTokens.colors.border.villageCenter,
  "--village-center-shadow": gameShadows.villageCenter,
  "--village-selection-border": gameTokens.colors.border.default,
  "--village-selection-background": gameTokens.colors.overlay.paper94,
  "--village-selection-shadow": gameShadows.villageSelection,
  "--farm-map-ground": gameTokens.colors.map.terrainGround,
  "--farm-map-road": gameVisuals.village.roadBackground,
  "--farm-map-road-border": gameVisuals.village.roadBorder,
  "--farm-center-ground-light": gameTokens.colors.map.centerGroundLight,
  "--farm-center-ground": gameTokens.colors.map.centerGround,
  "--farm-center-ground-dark": gameTokens.colors.map.centerGroundDark,
  "--farm-marker-surface": gameTokens.colors.surface.paper,
  "--farm-marker-text": gameTokens.colors.text.primary,
  "--game-motion-quick": gameTokens.motion.quick,
};

function toResourceKey(resourceName: string): ResourceKey | null {
  const normalizedName = resourceName.toLowerCase();

  return normalizedName in resourceMeta
    ? (normalizedName as ResourceKey)
    : null;
}

export function VillageFieldMap({ villageId }: VillageFieldMapProps) {
  const [selectedFarmNumber, setSelectedFarmNumber] = useState(13);
  const { data: farms = [], isLoading, isError } = useVillageFarms(villageId);

  const farmsByNumber = new Map(
    farms.map((farm) => [farm.farm_number, farm]),
  );

  const plots: FieldPlot[] = farmFieldLayout.flatMap((layoutSlot) => {
    const farm = farmsByNumber.get(layoutSlot.farmNumber);

    if (!farm) {
      return [];
    }

    const resource = toResourceKey(farm.resource_type.name);

    if (!resource) {
      return [];
    }

    return [
      {
        id: farm.id,
        farmNumber: farm.farm_number,
        resource,
        level: farm.level,
        ...getFarmFieldPosition(layoutSlot),
      },
    ];
  });

  const selected =
    plots.find((plot) => plot.farmNumber === selectedFarmNumber) ?? plots[0];

  if (isLoading) {
    return (
      <GamePanel className={styles.mapPanel} style={mapVariables}>
        <Typography>Loading village fields...</Typography>
      </GamePanel>
    );
  }

  if (isError || !selected) {
    return (
      <GamePanel className={styles.mapPanel} style={mapVariables}>
        <Typography>Unable to load village fields.</Typography>
      </GamePanel>
    );
  }

  return (
    <GamePanel className={styles.mapPanel} style={mapVariables}>
      <Box className={styles.world}>
        <FarmTerrain
          plots={plots}
          selectedFarmNumber={selected.farmNumber}
          onSelectFarm={setSelectedFarmNumber}
        />

        {plots.map((plot) => (
          <FarmPlotButton
            key={plot.id}
            resource={plot.resource}
            level={plot.level}
            left={plot.left}
            top={plot.top}
            selected={selected.farmNumber === plot.farmNumber}
            onSelect={() => setSelectedFarmNumber(plot.farmNumber)}
          />
        ))}

        <Box className={styles.villageCenter}>
          <Box>
            <CastleRoundedIcon sx={{ fontSize: { xs: 42, sm: 54 } }} />
            <Typography
              sx={{
                fontSize: { xs: 9, sm: 11 },
                fontWeight: gameTokens.typography.weight.black,
                textTransform: "uppercase",
                letterSpacing: gameTokens.typography.tracking.label,
              }}
            >
              Village center
            </Typography>
          </Box>
        </Box>
      </Box>

      <Stack
        className={styles.selectionPanel}
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <ResourceIcon resource={selected.resource} size={42} soft />
          <Box>
            <Typography fontWeight={gameTokens.typography.weight.heavy}>
              {resourceMeta[selected.resource].label} field · Level {selected.level}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Next level adds +{selected.level * 8 + 34}/h production
            </Typography>
          </Box>
        </Stack>

        <Button variant="contained" startIcon={<ArrowUpwardRoundedIcon />}>
          Upgrade to {selected.level + 1}
        </Button>
      </Stack>
    </GamePanel>
  );
}
