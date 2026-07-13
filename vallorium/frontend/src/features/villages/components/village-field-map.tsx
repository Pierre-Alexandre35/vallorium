import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import CastleRoundedIcon from "@mui/icons-material/CastleRounded";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useState } from "react";

import { GamePanel } from "@/components/ui/game-panel";
import { ResourceIcon } from "@/features/villages/components/resource-icon";
import { resourceMeta } from "@/features/villages/components/resource-meta";
import styles from "@/features/villages/components/village-field-map.module.css";
import type { ResourceKey } from "@/features/villages/types/village";
import {
  gameShadows,
  gameTokens,
  gameVisuals,
  type GameCssProperties,
} from "@/theme";

interface FieldPlot {
  id: number;
  resource: ResourceKey;
  level: number;
  left: string;
  top: string;
}

const plots: FieldPlot[] = [
  { id: 1, resource: "wood", level: 7, left: "23%", top: "9%" },
  { id: 2, resource: "crop", level: 7, left: "43%", top: "6%" },
  { id: 3, resource: "crop", level: 7, left: "63%", top: "10%" },
  { id: 4, resource: "iron", level: 6, left: "77%", top: "24%" },
  { id: 5, resource: "iron", level: 5, left: "82%", top: "45%" },
  { id: 6, resource: "wood", level: 6, left: "75%", top: "66%" },
  { id: 7, resource: "clay", level: 6, left: "61%", top: "79%" },
  { id: 8, resource: "clay", level: 6, left: "42%", top: "82%" },
  { id: 9, resource: "clay", level: 6, left: "23%", top: "76%" },
  { id: 10, resource: "crop", level: 7, left: "10%", top: "61%" },
  { id: 11, resource: "crop", level: 7, left: "7%", top: "41%" },
  { id: 12, resource: "iron", level: 6, left: "11%", top: "22%" },
  { id: 13, resource: "wood", level: 8, left: "31%", top: "26%" },
  { id: 14, resource: "clay", level: 8, left: "56%", top: "25%" },
  { id: 15, resource: "wood", level: 6, left: "68%", top: "43%" },
  { id: 16, resource: "crop", level: 6, left: "57%", top: "61%" },
  { id: 17, resource: "iron", level: 6, left: "34%", top: "63%" },
  { id: 18, resource: "crop", level: 6, left: "20%", top: "46%" },
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

export function VillageFieldMap() {
  const [selected, setSelected] = useState<FieldPlot>(plots[12]);

  return (
    <GamePanel className={styles.mapPanel} style={mapVariables}>
      <Box className={styles.world}>
        {plots.map((plot) => {
          const isSelected = selected.id === plot.id;
          const meta = resourceMeta[plot.resource];
          return (
            <Box
              component="button"
              type="button"
              className={styles.plot}
              key={plot.id}
              aria-label={`${meta.label} field level ${plot.level}`}
              onClick={() => setSelected(plot)}
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
              <ResourceIcon resource={plot.resource} size={isSelected ? 60 : 54} />
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
