import { createTheme } from "@mui/material/styles";

import { gameComponents } from "@/theme/components";
import { gamePalette } from "@/theme/palette";
import { gameTokens } from "@/theme/tokens";
import { gameTypography } from "@/theme/typography";

export { gameShadows } from "@/theme/shadows";
export { gameTokens } from "@/theme/tokens";
export { gameVisuals } from "@/theme/visuals";
export type { GameCssProperties } from "@/theme/css-properties";

export const appTheme = createTheme({
  palette: gamePalette,
  shape: {
    borderRadius: gameTokens.radius.card,
  },
  typography: gameTypography,
  components: gameComponents,
});
