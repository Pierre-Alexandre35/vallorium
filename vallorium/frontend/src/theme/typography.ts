import type { ThemeOptions } from "@mui/material/styles";

import { gameTokens } from "@/theme/tokens";

export const gameTypography: ThemeOptions["typography"] = {
  fontFamily: gameTokens.typography.fontFamily,
  h1: { fontWeight: gameTokens.typography.weight.bold, letterSpacing: gameTokens.typography.tracking.tightest },
  h2: { fontWeight: gameTokens.typography.weight.bold, letterSpacing: gameTokens.typography.tracking.tighter },
  h3: { fontWeight: gameTokens.typography.weight.bold, letterSpacing: gameTokens.typography.tracking.tight },
  h4: { fontWeight: gameTokens.typography.weight.bold, letterSpacing: gameTokens.typography.tracking.heading },
  h5: { fontWeight: gameTokens.typography.weight.bold, letterSpacing: gameTokens.typography.tracking.subtle },
  h6: { fontWeight: gameTokens.typography.weight.strong },
  button: { fontWeight: gameTokens.typography.weight.strong, letterSpacing: gameTokens.typography.tracking.button },
};
