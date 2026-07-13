import CircleRoundedIcon from "@mui/icons-material/CircleRounded";
import { Box, Divider, Stack, Typography } from "@mui/material";

import { GamePanel } from "@/components/ui/game-panel";
import { gameTokens } from "@/theme";

const terrainItems = [
  { label: "Meadow", color: gameTokens.colors.map.meadow },
  { label: "Forest", color: gameTokens.colors.map.forest },
  { label: "Mountains", color: gameTokens.colors.map.mountainDark },
  { label: "Lake", color: gameTokens.colors.map.lake },
];

export function MapLegend() {
  return (
    <GamePanel sx={{ p: 2 }}>
      <Typography variant="subtitle2" fontWeight={gameTokens.typography.weight.bold}>
        Map legend
      </Typography>
      <Divider sx={{ my: 1.5 }} />
      <Stack spacing={1.1}>
        {terrainItems.map((item) => (
          <Stack key={item.label} direction="row" spacing={1} alignItems="center">
            <CircleRoundedIcon sx={{ fontSize: 15, color: item.color }} />
            <Typography variant="body2" color="text.secondary">
              {item.label}
            </Typography>
          </Stack>
        ))}
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 15,
              height: 15,
              borderRadius: "50%",
              bgcolor: "primary.main",
              border: "3px solid white",
              boxShadow: `0 0 0 1px ${gameTokens.colors.brand.forest}`,
            }}
          />
          <Typography variant="body2" color="text.secondary">
            Your village
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              minWidth: 20,
              height: 20,
              px: 0.5,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              bgcolor: "#f2d55d",
              color: "#3e4734",
              fontSize: 9,
              fontWeight: 900,
            }}
          >
            15
          </Box>
          <Typography variant="body2" color="text.secondary">
            Special crop field
          </Typography>
        </Stack>
      </Stack>
    </GamePanel>
  );
}
