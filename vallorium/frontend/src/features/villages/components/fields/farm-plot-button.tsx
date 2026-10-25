import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import { Box } from "@mui/material";

import styles from "@/features/villages/components/fields/farm-plot-button.module.css";
import { resourceMeta } from "@/features/villages/config/resource-meta";
import type { ResourceKey } from "@/features/villages/types/village";
import type { GameCssProperties } from "@/theme";

interface FarmPlotButtonProps {
  resource: ResourceKey;
  level: number;
  left: string;
  top: string;
  selected: boolean;
  upgrading: boolean;
  targetLevel?: number;
  onSelect: () => void;
}

export function FarmPlotButton({
  resource,
  level,
  left,
  top,
  selected,
  upgrading,
  targetLevel,
  onSelect,
}: FarmPlotButtonProps) {
  const meta = resourceMeta[resource];
  const Icon = meta.Icon;

  const style = {
    "--farm-left": left,
    "--farm-top": top,
    "--farm-color": meta.color,
  } as GameCssProperties;

  return (
    <Box
      component="button"
      type="button"
      className={styles.plot}
      data-selected={selected}
      data-upgrading={upgrading}
      aria-pressed={selected}
      aria-label={
        `${meta.label} field, level ${level}` +
        (upgrading ? `, upgrading to level ${targetLevel ?? level + 1}` : "")
      }
      onClick={onSelect}
      style={style}
    >
      <Box className={styles.iconSurface} aria-hidden="true">
        <Icon className={styles.icon} />
      </Box>
      <Box className={styles.levelBadge}>{level}</Box>
      {upgrading && (
        <Box className={styles.constructionBadge} aria-hidden="true">
          <ConstructionRoundedIcon sx={{ fontSize: 12 }} />
        </Box>
      )}
    </Box>
  );
}
