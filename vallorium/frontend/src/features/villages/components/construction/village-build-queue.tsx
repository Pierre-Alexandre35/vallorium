import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { GamePanel } from "@/components/ui/game-panel";
import { IconTile } from "@/components/ui/icon-tile";
import { useVillageFarms } from "@/features/villages/hooks/use-village-farms";
import { gameTokens } from "@/theme";

function formatRemaining(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

function getFieldName(resource: string): string {
  switch (resource) {
    case "iron":
      return "Iron mine";
    case "crop":
      return "Crop field";
    case "wood":
      return "Woodcutter";
    case "clay":
      return "Clay pit";
    default:
      return resource;
  }
}

export function VillageBuildQueue({ villageId }: { villageId: number }) {
  const { data: farms = [], isLoading, isError } = useVillageFarms(villageId);

  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const activeConstructions = farms.filter(
    (farm) => farm.active_upgrade != null,
  );

  return (
    <GamePanel sx={{ p: 2.25 }}>
      <Stack direction="row" spacing={1.2} alignItems="center">
        <IconTile
          color={gameTokens.colors.brand.amberDark}
          backgroundColor={gameTokens.colors.brand.amberLight}
        >
          <ConstructionRoundedIcon />
        </IconTile>

        <Box flex={1}>
          <Typography variant="h6">Build queue</Typography>
          <Typography variant="body2" color="text.secondary">
            {isLoading
              ? "Loading constructions..."
              : `${activeConstructions.length} active construction(s)`}
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 1.75 }} />

      {isError ? (
        <Typography color="error" variant="body2">
          Unable to load constructions.
        </Typography>
      ) : isLoading ? (
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      ) : activeConstructions.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No active constructions.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {activeConstructions.map((farm) => {
            const upgrade = farm.active_upgrade;
            if (!upgrade) return null;

            const deadline = Date.parse(upgrade.completes_at);
            const remaining = Number.isFinite(deadline)
              ? formatRemaining(deadline - now)
              : "Unavailable";

            return (
              <Box key={upgrade.upgrade_id}>
                <Typography fontWeight={gameTokens.typography.weight.heavy}>
                  {getFieldName(farm.resource_type.name)}
                  {" · "}
                  Level {farm.level} → {upgrade.target_level}
                </Typography>

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.7}
                  sx={{ mt: 0.65 }}
                >
                  <AccessTimeRoundedIcon
                    sx={{ fontSize: 17, color: "text.secondary" }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Finishes in {remaining}
                  </Typography>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </GamePanel>
  );
}
