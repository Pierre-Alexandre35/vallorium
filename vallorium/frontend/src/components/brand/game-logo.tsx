import CastleRoundedIcon from "@mui/icons-material/CastleRounded";
import { Box, Stack, Typography } from "@mui/material";

import { gameShadows, gameTokens } from "@/theme";

interface GameLogoProps {
  compact?: boolean;
  light?: boolean;
}

export function GameLogo({ compact = false, light = false }: GameLogoProps) {
  return (
    <Stack direction="row" spacing={1.2} alignItems="center">
      <Box
        sx={{
          width: compact ? 38 : 46,
          height: compact ? 38 : 46,
          display: "grid",
          placeItems: "center",
          borderRadius: compact ? 2.5 : 3,
          color: light ? "primary.dark" : "common.white",
          bgcolor: light ? "secondary.main" : "primary.main",
          border: "1px solid",
          borderColor: light ? gameTokens.colors.overlay.white50 : "primary.dark",
          boxShadow: gameShadows.logo,
        }}
      >
        <CastleRoundedIcon fontSize={compact ? "small" : "medium"} />
      </Box>
      <Box>
        <Typography
          component="div"
          sx={{
            color: light ? "common.white" : "text.primary",
            fontSize: compact ? 18 : 22,
            lineHeight: 1,
            fontWeight: gameTokens.typography.weight.black,
            letterSpacing: gameTokens.typography.tracking.tightest,
          }}
        >
          Verdant Realms
        </Typography>
        {!compact ? (
          <Typography
            component="div"
            variant="caption"
            sx={{
              mt: 0.4,
              color: light ? gameTokens.colors.overlay.white68 : "text.secondary",
              letterSpacing: gameTokens.typography.tracking.eyebrow,
              textTransform: "uppercase",
              fontWeight: gameTokens.typography.weight.bold,
            }}
          >
            Strategy begins here
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
}
