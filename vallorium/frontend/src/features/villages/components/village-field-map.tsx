import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import CastleRoundedIcon from "@mui/icons-material/CastleRounded";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useState } from "react";

import { GamePanel } from "@/components/ui/game-panel";
import { ResourceIcon } from "@/features/villages/components/resource-icon";
import { resourceMeta } from "@/features/villages/components/resource-meta";
import styles from "@/features/villages/components/village-field-map.module.css";
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

interface FieldPosition {
  farmNumber: number;
  left: string;
  top: string;
}

interface FieldPlot {
  id: number;
  farmNumber: number;
  resource: ResourceKey;
  level: number;
  left: string;
  top: string;
}

const fieldPositions: FieldPosition[] = [
  { farmNumber: 1, left: "23%", top: "9%" },
  { farmNumber: 2, left: "43%", top: "6%" },
  { farmNumber: 3, left: "63%", top: "10%" },
  { farmNumber: 4, left: "77%", top: "24%" },
  { farmNumber: 5, left: "82%", top: "45%" },
  { farmNumber: 6, left: "75%", top: "66%" },
  { farmNumber: 7, left: "61%", top: "79%" },
  { farmNumber: 8, left: "42%", top: "82%" },
  { farmNumber: 9, left: "23%", top: "76%" },
  { farmNumber: 10, left: "10%", top: "61%" },
  { farmNumber: 11, left: "7%", top: "41%" },
  { farmNumber: 12, left: "11%", top: "22%" },
  { farmNumber: 13, left: "31%", top: "26%" },
  { farmNumber: 14, left: "56%", top: "25%" },
  { farmNumber: 15, left: "68%", top: "43%" },
  { farmNumber: 16, left: "57%", top: "61%" },
  { farmNumber: 17, left: "34%", top: "63%" },
  { farmNumber: 18, left: "20%", top: "46%" },
];

const mapVariables: GameCssProperties = {
  "--village-panel-background": gameVisuals.village.panelBackground,
  "--village-map-max-width": `${gameTokens.layout.villageMapMaxWidth}px`,
  "--village-map-border": gameVisuals.village.mapBorder,
  "--village-map-background": gameVisuals.village.mapBackground,
  "--village-map-shadow": gameShadows.villageMap,
  "--village-road-border": gameVisuals.village.roadBorder,
  "--village-road-background": gameVisuals.village.roadBackground,
  "--village-map-inner-shadow": gameShadows.villageMapInner,
  "--village-fields-background": gameVisuals.village.fieldsBackground,
  "--village-level-color": gameTokens.colors.text.primary,
  "--village-level-background": gameTokens.colors.surface.paper,
  "--village-level-shadow": gameShadows.villageLevel,
  "--village-center-color": gameTokens.colors.text.villageCenter,
  "--village-center-background": gameVisuals.village.centerBackground,
  "--village-center-border": gameTokens.colors.border.villageCenter,
  "--village-center-shadow": gameShadows.villageCenter,
  "--village-selection-border": gameTokens.colors.border.default,
  "--village-selection-background": gameTokens.colors.overlay.paper94,
  "--village-selection-shadow": gameShadows.villageSelection,
  "--game-motion-quick": gameTokens.motion.quick,
};

export function VillageFieldMap({
  villageId,
}: VillageFieldMapProps) {
  const [selectedFarmNumber, setSelectedFarmNumber] = useState(13);

  const {
    data: farms = [],
    isLoading,
    isError,
  } = useVillageFarms(villageId);

  const farmsByNumber = new Map(
    farms.map((farm) => [farm.farm_number, farm]),
  );

  const plots: FieldPlot[] = fieldPositions.flatMap((position) => {
    const farm = farmsByNumber.get(position.farmNumber);

    if (!farm) {
      return [];
    }

    return [
      {
        id: farm.id,
        farmNumber: farm.farm_number,
        resource: farm.resource_type.name.toLowerCase() as ResourceKey,
        level: farm.level,
        left: position.left,
        top: position.top,
      },
    ];
  });

  const selected =
    plots.find((plot) => plot.farmNumber === selectedFarmNumber) ??
    plots[0];

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
        {plots.map((plot) => {
          const isSelected = selected.farmNumber === plot.farmNumber;
          const meta = resourceMeta[plot.resource];

          return (
            <Box
              component="button"
              type="button"
              className={styles.plot}
              key={plot.id}
              aria-label={`${meta.label} field level ${plot.level}`}
              onClick={() => setSelectedFarmNumber(plot.farmNumber)}
              style={
                {
                  "--plot-left": plot.left,
                  "--plot-top": plot.top,
                  "--plot-focus-color": meta.color,
                  "--plot-level-border": isSelected
                    ? meta.color
                    : gameTokens.colors.border.fieldLevel,
                } as GameCssProperties
              }
            >
              <ResourceIcon
                resource={plot.resource}
                size={isSelected ? 60 : 54}
              />
              <Box className={styles.levelBadge}>{plot.level}</Box>
            </Box>
          );
        })}

        <Box className={styles.villageCenter}>
          <Box>
            <CastleRoundedIcon sx={{ fontSize: { xs: 45, sm: 58 } }} />
            <Typography
              sx={{
                fontSize: { xs: 10, sm: 12 },
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
              {resourceMeta[selected.resource].label} field · Level{" "}
              {selected.level}
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
