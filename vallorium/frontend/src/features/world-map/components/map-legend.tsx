import { Box, Divider, Stack, Typography } from "@mui/material";

import { GamePanel } from "@/components/ui/game-panel";
import { gameTokens } from "@/theme";

const { map } = gameTokens.colors;

const swatches = [
  { label: "Meadow", color: map.meadow },
  { label: "Forest", color: map.forest },
  { label: "Clay basin", color: map.clay },
  { label: "Iron ridge", color: map.iron },
  { label: "Mountains", color: map.mountain },
  { label: "Lake", color: map.lake },
  { label: "Crop-rich tile", color: map.crop },
];

const villageOutlines = [
  { label: "Your village", color: map.villageCurrent },
  { label: "Other villages", color: map.villageOther },
];

function LegendRow({
  label,
  background,
  outline,
}: {
  label: string;
  background: string;
  outline?: string;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        sx={{
          width: 15,
          height: 15,
          borderRadius: 0.5,
          bgcolor: background,
          border: outline ? `2px solid ${outline}` : undefined,
        }}
      />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

export function MapLegend() {
  return (
    <GamePanel sx={{ p: 2 }}>
      <Typography
        variant="subtitle2"
        fontWeight={gameTokens.typography.weight.bold}
      >
        Map legend
      </Typography>
      <Divider sx={{ my: 1.5 }} />
      <Stack spacing={1.1}>
        {swatches.map(({ label, color }) => (
          <LegendRow key={label} label={label} background={color} />
        ))}
        {villageOutlines.map(({ label, color }) => (
          <LegendRow
            key={label}
            label={label}
            background={map.centerGround}
            outline={color}
          />
        ))}
      </Stack>
    </GamePanel>
  );
}
