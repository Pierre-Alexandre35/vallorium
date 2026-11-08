import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";

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
  const style: GameCssProperties = { "--farm-left": left, "--farm-top": top };
  const upgradeLabel = upgrading
    ? `, upgrading to level ${targetLevel ?? level + 1}`
    : "";

  return (
    <button
      type="button"
      className={styles.plot}
      data-selected={selected}
      aria-pressed={selected}
      aria-label={`${resourceMeta[resource].label} field, level ${level}${upgradeLabel}`}
      onClick={onSelect}
      style={style}
    >
      <span className={styles.level}>{level}</span>
      {upgrading && (
        <span className={styles.constructionBadge} aria-hidden="true">
          <ConstructionRoundedIcon sx={{ fontSize: 12 }} />
        </span>
      )}
    </button>
  );
}
