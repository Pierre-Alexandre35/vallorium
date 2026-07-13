import CenterFocusStrongRoundedIcon from "@mui/icons-material/CenterFocusStrongRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import ZoomOutRoundedIcon from "@mui/icons-material/ZoomOutRounded";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { GameShell } from "@/components/layouts/game-shell";
import { GamePanel } from "@/components/ui/game-panel";
import { MapLegend } from "@/features/world-map/components/map-legend";
import {
  WorldMapCanvas,
  type WorldMapCanvasHandle,
} from "@/features/world-map/components/world-map-canvas";
import { TileDetailsPanel } from "@/features/world-map/components/tile-details-panel";
import { createDemoWorldMap } from "@/features/world-map/data/demo-world";
import { useWorldMapData } from "@/features/world-map/hooks/use-world-map-data";
import type { MapBounds, WorldMapTile } from "@/features/world-map/types/map";
import { gameTokens } from "@/theme";

const MAP_BOUNDS: MapBounds = {
  minX: -20,
  maxX: 20,
  minY: -20,
  maxY: 20,
};

export function WorldMapPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<WorldMapCanvasHandle | null>(null);
  const query = useWorldMapData(1, MAP_BOUNDS);
  const previewData = useMemo(() => createDemoWorldMap(MAP_BOUNDS), []);
  const mapData = query.data ?? previewData;
  const playerTile = mapData.tiles.find((tile) => tile.occupant?.isCurrentPlayer) ?? null;
  const [selectedTile, setSelectedTile] = useState<WorldMapTile | null>(playerTile);
  const [hoveredTile, setHoveredTile] = useState<WorldMapTile | null>(null);

  useEffect(() => {
    setHoveredTile(null);
    setSelectedTile((current) => {
      if (current) {
        const refreshed = mapData.tiles.find((tile) => tile.id === current.id);
        if (refreshed) return refreshed;
      }

      return mapData.tiles.find((tile) => tile.occupant?.isCurrentPlayer) ?? null;
    });
  }, [mapData]);

  const displayedTile = hoveredTile ?? selectedTile;

  return (
    <GameShell>
      <Container
        maxWidth={false}
        sx={{ maxWidth: gameTokens.layout.contentMaxWidth, pt: { xs: 2, md: 3 } }}
      >
        {query.isError ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            The map API is unavailable, so this page is rendering the supplied resource-layout data as a local 100×100 preview world.
          </Alert>
        ) : null}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: 2 }}
        >
          <Box>
            {query.isLoading && !query.isError ? (
              <>
                <Skeleton width={210} height={42} />
                <Skeleton width={330} />
              </>
            ) : (
              <>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MapRoundedIcon color="primary" />
                  <Typography variant="h4">World map</Typography>
                </Stack>
                <Typography color="text.secondary" sx={{ mt: 0.35 }}>
                  Explore tiles, inspect field layouts, and find your next settlement.
                </Typography>
              </>
            )}
          </Box>

          <Stack direction="row" spacing={0.75} alignItems="center">
            <Tooltip title="Zoom out">
              <IconButton onClick={() => canvasRef.current?.zoomOut()} aria-label="Zoom out">
                <ZoomOutRoundedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom in">
              <IconButton onClick={() => canvasRef.current?.zoomIn()} aria-label="Zoom in">
                <ZoomInRoundedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset view">
              <IconButton onClick={() => canvasRef.current?.resetView()} aria-label="Reset map view">
                <CenterFocusStrongRoundedIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<MyLocationRoundedIcon />}
              onClick={() => {
                if (playerTile) canvasRef.current?.centerOn(playerTile.x, playerTile.y);
              }}
              disabled={!playerTile}
              sx={{ display: { xs: "none", sm: "inline-flex" } }}
            >
              My village
            </Button>
            <Tooltip title="Refresh map data">
              <IconButton onClick={() => query.refetch()} aria-label="Refresh map data">
                <RefreshRoundedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 320px" },
            gap: 2,
            alignItems: "start",
          }}
        >
          <GamePanel sx={{ p: { xs: 0.75, md: 1 }, overflow: "hidden" }}>
            <WorldMapCanvas
              ref={canvasRef}
              tiles={mapData.tiles}
              bounds={mapData.bounds}
              selectedTileId={selectedTile?.id ?? null}
              initialCenter={playerTile ? { x: playerTile.x, y: playerTile.y } : undefined}
              onSelectTile={setSelectedTile}
              onHoverTile={setHoveredTile}
            />
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ px: 1, pt: 1, pb: 0.25 }}
            >
              <Typography variant="caption" color="text.secondary">
                Showing {mapData.tiles.length.toLocaleString()} tiles · World 1
              </Typography>
              {displayedTile ? (
                <Typography variant="caption" fontWeight={gameTokens.typography.weight.bold}>
                  {displayedTile.x} | {displayedTile.y} · {displayedTile.resourceLayout}
                </Typography>
              ) : null}
            </Stack>
          </GamePanel>

          <Stack spacing={2}>
            <TileDetailsPanel
              tile={selectedTile}
              onCenter={(tile) => canvasRef.current?.centerOn(tile.x, tile.y)}
              onOpenVillage={() => navigate("/app")}
            />
            <MapLegend />
          </Stack>
        </Box>
      </Container>
    </GameShell>
  );
}
