import type { ThemeOptions } from "@mui/material/styles";

import { gameTokens } from "@/theme/tokens";

export const gamePalette: ThemeOptions["palette"] = {
  mode: "light",
  primary: {
    main: gameTokens.colors.brand.forest,
    dark: gameTokens.colors.brand.forestDark,
    light: gameTokens.colors.brand.forestLight,
    contrastText: gameTokens.colors.common.white,
  },
  secondary: {
    main: gameTokens.colors.brand.amber,
    dark: gameTokens.colors.brand.amberDark,
    light: gameTokens.colors.brand.amberLight,
    contrastText: gameTokens.colors.text.amberContrast,
  },
  error: {
    main: gameTokens.colors.danger,
  },
  background: {
    default: gameTokens.colors.surface.parchment,
    paper: gameTokens.colors.surface.paper,
  },
  text: {
    primary: gameTokens.colors.text.primary,
    secondary: gameTokens.colors.text.secondary,
  },
  divider: gameTokens.colors.border.default,
};
