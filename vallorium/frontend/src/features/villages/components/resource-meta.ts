import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import GrassRoundedIcon from "@mui/icons-material/GrassRounded";
import LandscapeRoundedIcon from "@mui/icons-material/LandscapeRounded";
import ParkRoundedIcon from "@mui/icons-material/ParkRounded";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import type { ComponentType } from "react";

import type { ResourceKey } from "@/features/villages/types/village";
import { gameTokens } from "@/theme";

export const resourceMeta: Record<
  ResourceKey,
  { label: string; color: string; light: string; Icon: ComponentType<SvgIconProps> }
> = {
  wood: {
    label: "Lumber",
    color: gameTokens.colors.resource.wood,
    light: gameTokens.colors.resource.woodLight,
    Icon: ParkRoundedIcon,
  },
  clay: {
    label: "Clay",
    color: gameTokens.colors.resource.clay,
    light: gameTokens.colors.resource.clayLight,
    Icon: LandscapeRoundedIcon,
  },
  iron: {
    label: "Iron",
    color: gameTokens.colors.resource.iron,
    light: gameTokens.colors.resource.ironLight,
    Icon: ConstructionRoundedIcon,
  },
  crop: {
    label: "Crop",
    color: gameTokens.colors.resource.crop,
    light: gameTokens.colors.resource.cropLight,
    Icon: GrassRoundedIcon,
  },
};
