import { Box } from "@mui/material";

import { resourceMeta } from "@/features/villages/components/resource-meta";
import type { ResourceKey } from "@/features/villages/types/village";
import { gameShadows, gameTokens } from "@/theme";

interface ResourceIconProps {
  resource: ResourceKey;
  size?: number;
  soft?: boolean;
}

export function ResourceIcon({ resource, size = 34, soft = false }: ResourceIconProps) {
  const meta = resourceMeta[resource];
  const Icon = meta.Icon;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        display: "grid",
        placeItems: "center",
        borderRadius: gameTokens.radius.round,
        color: soft ? meta.color : "common.white",
        bgcolor: soft ? meta.light : meta.color,
        border: "1px solid",
        borderColor: soft ? `${meta.color}33` : gameTokens.colors.overlay.white50,
        boxShadow: soft ? "none" : gameShadows.resourceIcon,
        "& svg": { fontSize: size * 0.56 },
      }}
    >
      <Icon />
    </Box>
  );
}
