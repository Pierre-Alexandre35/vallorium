import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import GrassRoundedIcon from "@mui/icons-material/GrassRounded";
import LandscapeRoundedIcon from "@mui/icons-material/LandscapeRounded";
import ParkRoundedIcon from "@mui/icons-material/ParkRounded";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import type { ComponentType } from "react";

import type { ResourceKey } from "@/features/villages/types/village";
import { gameTokens } from "@/theme";

interface ResourceTerrainPalette {
  light: string;
  base: string;
  dark: string;
}

interface ResourceMeta {
  label: string;
  color: string;
  light: string;
  Icon: ComponentType<SvgIconProps>;
  terrain: ResourceTerrainPalette;
}

export const resourceKeys: readonly ResourceKey[] = [
  "wood",
  "clay",
  "iron",
  "crop",
];

export const resourceMeta: Record<ResourceKey, ResourceMeta> = {
  wood: {
    label: "Lumber",
    color: gameTokens.colors.resource.wood,
    light: gameTokens.colors.resource.woodLight,
    Icon: ParkRoundedIcon,
    terrain: {
      light: gameTokens.colors.map.forestLight,
      base: gameTokens.colors.map.forest,
      dark: gameTokens.colors.map.forestDark,
    },
  },
  clay: {
    label: "Clay",
    color: gameTokens.colors.resource.clay,
    light: gameTokens.colors.resource.clayLight,
    Icon: LandscapeRoundedIcon,
    terrain: {
      light: gameTokens.colors.map.clayLight,
      base: gameTokens.colors.map.clay,
      dark: gameTokens.colors.map.clayDark,
    },
  },
  iron: {
    label: "Iron",
    color: gameTokens.colors.resource.iron,
    light: gameTokens.colors.resource.ironLight,
    Icon: ConstructionRoundedIcon,
    terrain: {
      light: gameTokens.colors.map.ironLight,
      base: gameTokens.colors.map.iron,
      dark: gameTokens.colors.map.ironDark,
    },
  },
  crop: {
    label: "Crop",
    color: gameTokens.colors.resource.crop,
    light: gameTokens.colors.resource.cropLight,
    Icon: GrassRoundedIcon,
    terrain: {
      light: gameTokens.colors.map.meadowAlt,
      base: gameTokens.colors.map.meadow,
      dark: gameTokens.colors.map.cropDark,
    },
  },
};
