import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import CastleRoundedIcon from "@mui/icons-material/CastleRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import { Alert, Box, Button, Snackbar, Stack, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useEffect, useState } from "react";

import { GamePanel } from "@/components/ui/game-panel";
import {
  farmFieldLayout,
  getFarmFieldPosition,
} from "@/features/villages/components/fields/farm-field-layout";
import { FarmPlotButton } from "@/features/villages/components/fields/farm-plot-button";
import { FarmTerrain } from "@/features/villages/components/fields/farm-terrain";
import styles from "@/features/villages/components/fields/village-field-map.module.css";
import { ResourceIcon } from "@/features/villages/components/resources/resource-icon";
import { resourceMeta } from "@/features/villages/config/resource-meta";
import { useVillageFarms } from "@/features/villages/hooks/use-village-farms";
import { useUpgradeFarm } from "@/features/villages/hooks/use-upgrade-farm";
import type {
  ActiveFarmUpgrade,
  ResourceKey,
} from "@/features/villages/types/village";
import {
  gameShadows,
  gameTokens,
  gameVisuals,
  type GameCssProperties,
} from "@/theme";

interface VillageFieldMapProps {
  villageId: number;
}

interface FieldPlot {
  id: number;
  farmNumber: number;
  resource: ResourceKey;
  level: number;
  activeUpgrade: ActiveFarmUpgrade | null;
  upgrading: boolean;
  left: string;
  top: string;
}

const mapVariables: GameCssProperties = {
  "--village-map-max-width": `${gameTokens.layout.villageMapMaxWidth}px`,
  "--village-map-border": gameVisuals.village.mapBorder,
  "--village-map-shadow": gameShadows.villageMap,
  "--village-center-color": gameTokens.colors.text.villageCenter,
  "--village-center-background": gameVisuals.village.centerBackground,
  "--village-center-border": gameTokens.colors.border.villageCenter,
  "--village-center-shadow": gameShadows.villageCenter,
  "--village-selection-border": gameTokens.colors.border.default,
  "--village-selection-background": gameTokens.colors.overlay.paper94,
  "--village-selection-shadow": gameShadows.villageSelection,
  "--farm-map-ground": gameTokens.colors.map.terrainGround,
  "--farm-map-road": gameVisuals.village.roadBackground,
  "--farm-map-road-border": gameVisuals.village.roadBorder,
  "--farm-center-ground-light": gameTokens.colors.map.centerGroundLight,
  "--farm-center-ground": gameTokens.colors.map.centerGround,
  "--farm-center-ground-dark": gameTokens.colors.map.centerGroundDark,
  "--farm-marker-surface": gameTokens.colors.surface.paper,
  "--farm-marker-text": gameTokens.colors.text.primary,
  "--game-motion-quick": gameTokens.motion.quick,
  "--village-construction-background":
    gameTokens.colors.construction.background,
  "--village-construction-border": gameTokens.colors.construction.border,
  "--village-construction-icon": gameTokens.colors.construction.icon,
  "--village-construction-text": gameTokens.colors.construction.text,
};

function toResourceKey(resourceName: string): ResourceKey | null {
  const normalizedName = resourceName.toLowerCase();

  return normalizedName in resourceMeta
    ? (normalizedName as ResourceKey)
    : null;
}

function upgradeErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (error.response?.status === 409) {
      return "Upgrade rejected: check available resources or existing construction.";
    }
  }
  return "Unable to start the upgrade. Please try again.";
}

function formatRemaining(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function VillageFieldMap({ villageId }: VillageFieldMapProps) {
  const queryClient = useQueryClient();
  const [selectedFarmNumber, setSelectedFarmNumber] = useState(13);
  const [now, setNow] = useState(() => Date.now());
  const { data: farms = [], isLoading, isError } = useVillageFarms(villageId);
  const upgradeFarmMutation = useUpgradeFarm(villageId);
  const hasActiveUpgrade = farms.some((farm) => farm.active_upgrade != null);

  // Countdown is purely presentational. Never change field levels locally.
  useEffect(() => {
    if (!hasActiveUpgrade) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [hasActiveUpgrade]);

  // Refresh when the nearest construction is due, including when the game
  // remains open for hours. The server is the authority on actual completion.
  const nextCompletionAt = farms.reduce((earliest, farm) => {
    const completesAt = farm.active_upgrade?.completes_at;
    if (!completesAt) return earliest;
    const deadline = Date.parse(completesAt);
    return Number.isFinite(deadline) ? Math.min(earliest, deadline) : earliest;
  }, Number.POSITIVE_INFINITY);

  useEffect(() => {
    if (!Number.isFinite(nextCompletionAt)) return;
    const delay = Math.min(
      2_147_483_647,
      Math.max(0, nextCompletionAt - Date.now() + 750),
    );
    const timeout = window.setTimeout(() => {
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["villages", villageId, "farms"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard", "current"],
        }),
      ]);
    }, delay);
    return () => window.clearTimeout(timeout);
  }, [nextCompletionAt, queryClient, villageId]);

  const farmsByNumber = new Map(farms.map((farm) => [farm.farm_number, farm]));

  const plots: FieldPlot[] = farmFieldLayout.flatMap((layoutSlot) => {
    const farm = farmsByNumber.get(layoutSlot.farmNumber);

    if (!farm) {
      return [];
    }

    const resource = toResourceKey(farm.resource_type.name);

    if (!resource) {
      return [];
    }

    return [
      {
        id: farm.id,
        farmNumber: farm.farm_number,
        resource,
        level: farm.level,
        activeUpgrade: farm.active_upgrade ?? null,
        upgrading: farm.active_upgrade != null,
        ...getFarmFieldPosition(layoutSlot),
      },
    ];
  });

  const selected =
    plots.find((plot) => plot.farmNumber === selectedFarmNumber) ?? plots[0];
  const selectedUpgrade = selected?.activeUpgrade;
  const isStartingSelected =
    upgradeFarmMutation.isPending &&
    upgradeFarmMutation.variables === selected?.id;
  const completionTime = selectedUpgrade
    ? Date.parse(selectedUpgrade.completes_at)
    : Number.NaN;
  const remainingTime = Number.isFinite(completionTime)
    ? formatRemaining(Math.max(0, completionTime - now))
    : null;

  if (isLoading) {
    return (
      <GamePanel className={styles.mapPanel} style={mapVariables}>
        <Typography>Loading village fields...</Typography>
      </GamePanel>
    );
  }

  if (isError || !selected) {
    return (
      <GamePanel className={styles.mapPanel} style={mapVariables}>
        <Typography>Unable to load village fields.</Typography>
      </GamePanel>
    );
  }

  return (
    <GamePanel className={styles.mapPanel} style={mapVariables}>
      <Box className={styles.world}>
        <FarmTerrain
          plots={plots}
          selectedFarmNumber={selected.farmNumber}
          onSelectFarm={setSelectedFarmNumber}
        />

        {plots.map((plot) => (
          <FarmPlotButton
            key={plot.id}
            resource={plot.resource}
            level={plot.level}
            left={plot.left}
            top={plot.top}
            selected={selected.farmNumber === plot.farmNumber}
            upgrading={plot.upgrading}
            targetLevel={plot.activeUpgrade?.target_level}
            onSelect={() => setSelectedFarmNumber(plot.farmNumber)}
          />
        ))}

        <Box className={styles.villageCenter}>
          <Box>
            <CastleRoundedIcon sx={{ fontSize: { xs: 42, sm: 54 } }} />
            <Typography
              sx={{
                fontSize: { xs: 9, sm: 11 },
                fontWeight: gameTokens.typography.weight.black,
                textTransform: "uppercase",
                letterSpacing: gameTokens.typography.tracking.label,
              }}
            >
              Village center
            </Typography>
          </Box>
        </Box>
      </Box>

      <Stack
        className={styles.selectionPanel}
        data-upgrading={Boolean(selectedUpgrade)}
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <ResourceIcon resource={selected.resource} size={42} soft />
          <Box>
            <Typography fontWeight={gameTokens.typography.weight.heavy}>
              {resourceMeta[selected.resource].label} field · Level{" "}
              {selected.level}
              {selectedUpgrade ? ` → ${selectedUpgrade.target_level}` : ""}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedUpgrade
                ? remainingTime === "0:00"
                  ? "Finishing construction…"
                  : remainingTime
                    ? `Construction · ${remainingTime} remaining`
                    : "Construction in progress"
                : `Next level adds +${selected.level * 8 + 34}/h production`}
            </Typography>
          </Box>
        </Stack>

        <Button
          variant={selectedUpgrade ? "outlined" : "contained"}
          className={selectedUpgrade ? styles.upgradingButton : undefined}
          startIcon={
            selectedUpgrade ? (
              <ConstructionRoundedIcon />
            ) : (
              <ArrowUpwardRoundedIcon />
            )
          }
          disabled={Boolean(selectedUpgrade) || upgradeFarmMutation.isPending}
          onClick={() => upgradeFarmMutation.mutate(selected.id)}
        >
          {selectedUpgrade
            ? `Upgrading to ${selectedUpgrade.target_level}`
            : isStartingSelected
              ? "Starting…"
              : `Upgrade to ${selected.level + 1}`}
        </Button>
      </Stack>
      <Snackbar
        open={upgradeFarmMutation.isError}
        autoHideDuration={5_000}
        onClose={() => upgradeFarmMutation.reset()}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => upgradeFarmMutation.reset()}
          severity="error"
          variant="filled"
        >
          {upgradeErrorMessage(upgradeFarmMutation.error)}
        </Alert>
      </Snackbar>
    </GamePanel>
  );
}
