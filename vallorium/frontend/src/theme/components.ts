import type { ThemeOptions } from "@mui/material/styles";

import { gameShadows } from "@/theme/shadows";
import { gameTokens } from "@/theme/tokens";
import { gameVisuals } from "@/theme/visuals";

export const gameComponents: ThemeOptions["components"] = {
  MuiCssBaseline: {
    styleOverrides: {
      html: {
        minWidth: 320,
        backgroundColor: gameTokens.colors.surface.parchment,
      },
      body: {
        minWidth: 320,
        minHeight: "100vh",
        backgroundColor: gameTokens.colors.surface.parchment,
        backgroundImage: gameVisuals.pageBackground,
      },
      "::selection": {
        color: gameTokens.colors.common.white,
        backgroundColor: gameTokens.colors.brand.forest,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: "none",
        borderColor: gameTokens.colors.border.default,
      },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        minHeight: 42,
        borderRadius: gameTokens.radius.button,
        textTransform: "none",
        paddingInline: 18,
      },
      containedPrimary: {
        boxShadow: gameShadows.button,
        "&:hover": {
          boxShadow: gameShadows.buttonHover,
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: gameTokens.radius.button,
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      fullWidth: true,
      variant: "outlined",
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        backgroundColor: gameTokens.colors.surface.input,
        borderRadius: gameTokens.radius.input,
        "& fieldset": { borderColor: gameTokens.colors.border.default },
        "&:hover fieldset": { borderColor: gameTokens.colors.border.hover },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        border: `1px solid ${gameTokens.colors.border.default}`,
        boxShadow: gameShadows.card,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: gameTokens.radius.tooltip,
        fontSize: 12,
      },
    },
  },
};
