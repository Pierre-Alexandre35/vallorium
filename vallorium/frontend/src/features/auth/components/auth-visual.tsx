import CastleRoundedIcon from "@mui/icons-material/CastleRounded";
import GrassRoundedIcon from "@mui/icons-material/GrassRounded";
import LandscapeRoundedIcon from "@mui/icons-material/LandscapeRounded";
import ParkRoundedIcon from "@mui/icons-material/ParkRounded";
import { Box, Chip, Stack, Typography } from "@mui/material";

import { GameLogo } from "@/components/brand/game-logo";
import styles from "@/features/auth/components/auth-visual.module.css";
import {
  gameShadows,
  gameTokens,
  gameVisuals,
  type GameCssProperties,
} from "@/theme";

const fields = [
  { icon: <ParkRoundedIcon />, left: "14%", top: "30%", color: gameTokens.colors.auth.forestField },
  { icon: <LandscapeRoundedIcon />, left: "68%", top: "17%", color: gameTokens.colors.resource.clay },
  { icon: <GrassRoundedIcon />, left: "72%", top: "66%", color: gameTokens.colors.auth.cropField },
  { icon: <ParkRoundedIcon />, left: "20%", top: "70%", color: gameTokens.colors.auth.forestField },
];

const visualVariables: GameCssProperties = {
  "--auth-background": gameVisuals.auth.background,
  "--auth-fallback-background": gameTokens.colors.brand.forestDark,
  "--auth-common-white": gameTokens.colors.common.white,
  "--auth-noise": gameVisuals.noiseDataUri,
  "--auth-map-border": gameVisuals.auth.mapBorder,
  "--auth-map-background": gameVisuals.auth.mapBackground,
  "--auth-map-shadow": gameShadows.authMap,
  "--auth-field-border": gameVisuals.auth.fieldBorder,
  "--auth-field-shadow": gameShadows.authField,
  "--auth-center-color": gameTokens.colors.text.authVillageCenter,
  "--auth-center-background": gameVisuals.auth.centerBackground,
  "--auth-center-border": gameTokens.colors.border.authVillageCenter,
  "--auth-center-shadow": gameShadows.authVillageCenter,
};

export function AuthVisual() {
  return (
    <Box
      className={styles.root}
      style={visualVariables}
      sx={{ minHeight: { xs: 360, md: 690 }, p: { xs: 3.5, md: 5 } }}
    >
      <GameLogo light />

      <Stack sx={{ position: "relative", zIndex: 2, mt: { xs: 5, md: 8 }, maxWidth: 500 }}>
        <Chip
          label="A modern classic strategy experience"
          size="small"
          sx={{
            alignSelf: "flex-start",
            color: gameTokens.colors.text.authBadge,
            bgcolor: gameTokens.colors.overlay.white09,
            border: `1px solid ${gameTokens.colors.overlay.white13}`,
            fontWeight: gameTokens.typography.weight.strong,
          }}
        />
        <Typography variant="h2" sx={{ mt: 2.5, fontSize: { xs: 40, md: 58 }, lineHeight: 1.02 }}>
          Raise a village. Shape an empire.
        </Typography>
        <Typography
          sx={{
            mt: 2.25,
            color: gameTokens.colors.overlay.white72,
            fontSize: 17,
            lineHeight: 1.65,
          }}
        >
          Balance production, plan every upgrade and lead your people from a quiet settlement to the center of the realm.
        </Typography>
      </Stack>

      <Box className={styles.realmMap}>
        {fields.map((field, index) => (
          <Box
            className={styles.field}
            key={index}
            style={
              {
                "--field-left": field.left,
                "--field-top": field.top,
                "--field-color": field.color,
              } as GameCssProperties
            }
          >
            {field.icon}
          </Box>
        ))}
        <Box className={styles.villageCenter}>
          <CastleRoundedIcon sx={{ fontSize: { xs: 46, md: 60 } }} />
        </Box>
      </Box>
    </Box>
  );
}
