import { Box } from "@mui/material";
import type { PropsWithChildren } from "react";

interface IconTileProps extends PropsWithChildren {
  backgroundColor: string;
  color: string;
  size?: number;
}

export function IconTile({
  backgroundColor,
  children,
  color,
  size = 38,
}: IconTileProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        display: "grid",
        placeItems: "center",
        borderRadius: 2,
        color,
        bgcolor: backgroundColor,
      }}
    >
      {children}
    </Box>
  );
}
