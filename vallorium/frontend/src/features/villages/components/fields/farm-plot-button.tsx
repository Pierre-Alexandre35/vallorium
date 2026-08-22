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
  onSelect: () => void;
}

export function FarmPlotButton({
  resource,
  level,
  left,
  top,
  selected,
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
      aria-pressed={selected}
      aria-label={`${meta.label} field, level ${level}`}
      onClick={onSelect}
      style={style}
    >
      <Box className={styles.iconSurface} aria-hidden="true">
        <Icon className={styles.icon} />
      </Box>
      <Box className={styles.levelBadge}>{level}</Box>
    </Box>
  );
}
