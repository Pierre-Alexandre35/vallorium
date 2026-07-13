import { Box, CircularProgress } from "@mui/material";
import {
  Application,
  Container,
  Graphics,
  Rectangle,
  Text,
  TextStyle,
} from "pixi.js";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import type {
  MapBounds,
  TerrainType,
  WorldMapTile,
} from "@/features/world-map/types/map";
import { gameTokens } from "@/theme";
import styles from "@/features/world-map/components/world-map-canvas.module.css";

const TILE_SIZE = 58;
const TILE_GAP = 2;
const TILE_STEP = TILE_SIZE + TILE_GAP;
const MIN_SCALE = 0.42;
const MAX_SCALE = 1.65;

export type WorldMapCanvasHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  centerOn: (x: number, y: number) => void;
};

type WorldMapCanvasProps = {
  tiles: WorldMapTile[];
  bounds: MapBounds;
  selectedTileId: number | null;
  initialCenter?: { x: number; y: number };
  onSelectTile: (tile: WorldMapTile) => void;
  onHoverTile?: (tile: WorldMapTile | null) => void;
};

type Runtime = {
  app: Application;
  world: Container;
  selection: Graphics;
  tilePositions: Map<number, { x: number; y: number }>;
  bounds: MapBounds;
  scale: number;
  dragged: boolean;
  hasInitialView: boolean;
  cleanupDomEvents: () => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function terrainColor(terrain: TerrainType, variant: number): string {
  const map = gameTokens.colors.map;

  switch (terrain) {
    case "forest":
      return variant % 2 === 0 ? map.forest : map.forestDark;
    case "mountain":
      return variant % 2 === 0 ? map.mountain : map.mountainDark;
    case "lake":
      return variant % 2 === 0 ? map.lake : map.lakeLight;
    case "clay":
      return variant % 2 === 0 ? map.clay : map.clayLight;
    case "iron":
      return variant % 2 === 0 ? map.iron : map.ironLight;
    case "meadow":
    default:
      return variant % 2 === 0 ? map.meadow : map.meadowAlt;
  }
}

function drawTree(graphics: Graphics, x: number, y: number, scale = 1) {
  const map = gameTokens.colors.map;
  graphics.rect(x - 1.3 * scale, y + 5 * scale, 2.6 * scale, 5 * scale).fill("#6f5130");
  graphics
    .poly([
      x,
      y - 8 * scale,
      x - 7 * scale,
      y + 6 * scale,
      x + 7 * scale,
      y + 6 * scale,
    ])
    .fill(map.forestDark);
  graphics
    .poly([
      x,
      y - 3 * scale,
      x - 8 * scale,
      y + 10 * scale,
      x + 8 * scale,
      y + 10 * scale,
    ])
    .fill(map.forest);
}

function drawTerrainDecoration(tile: WorldMapTile, graphics: Graphics) {
  const map = gameTokens.colors.map;
  const offset = tile.visualVariant * 3;

  switch (tile.terrain) {
    case "forest":
      drawTree(graphics, 18 + offset, 20, 0.72);
      drawTree(graphics, 38 - offset / 2, 30, 0.9);
      drawTree(graphics, 28, 42 - offset, 0.62);
      break;
    case "mountain":
      graphics
        .poly([8, 48, 23 + offset, 12, 39, 48])
        .fill(map.mountainDark)
        .poly([22, 48, 39, 18 + offset / 2, 54, 48])
        .fill(map.mountain)
        .poly([18 + offset, 24, 23 + offset, 12, 28 + offset, 25])
        .fill(map.snow)
        .poly([34, 28 + offset / 3, 39, 18 + offset / 2, 44, 29])
        .fill(map.snow);
      break;
    case "lake":
      graphics
        .roundRect(7, 9, 44, 40, 17)
        .fill({ color: map.lake, alpha: 0.9 })
        .moveTo(14, 29)
        .bezierCurveTo(23, 24, 33, 34, 45, 28)
        .stroke({ color: map.lakeLight, width: 2, alpha: 0.8 });
      break;
    case "clay":
      graphics
        .ellipse(22, 34, 14, 10)
        .fill({ color: map.clay, alpha: 0.9 })
        .ellipse(38, 24, 12, 8)
        .fill({ color: map.clayLight, alpha: 0.9 })
        .moveTo(14, 34)
        .lineTo(29, 30)
        .stroke({ color: "#8d4f3e", width: 2, alpha: 0.55 });
      break;
    case "iron":
      graphics
        .poly([10, 43, 18, 20, 30, 16, 35, 38])
        .fill(map.iron)
        .poly([27, 43, 37, 24, 49, 20, 52, 42])
        .fill(map.ironLight)
        .circle(21, 25, 3)
        .fill({ color: map.snow, alpha: 0.72 });
      break;
    case "meadow":
    default:
      for (let index = 0; index < 5; index += 1) {
        const x = 9 + ((tile.x * 13 + tile.y * 7 + index * 17) & 39);
        const y = 10 + ((tile.x * 5 + tile.y * 11 + index * 13) & 35);
        graphics.circle(x, y, index % 2 === 0 ? 1.5 : 1).fill({
          color: index % 3 === 0 ? "#f3d56b" : map.forestDark,
          alpha: 0.62,
        });
      }
      break;
  }
}

function createVillageMarker(tile: WorldMapTile) {
  const map = gameTokens.colors.map;
  const marker = new Container();
  const occupant = tile.occupant;

  if (!occupant) return marker;

  const isOasis = occupant.type === "oasis";
  const accent = isOasis
    ? map.oasis
    : occupant.isCurrentPlayer
      ? map.villageCurrent
      : map.villageOther;

  const halo = new Graphics()
    .circle(0, 0, isOasis ? 13 : 15)
    .fill({ color: map.village, alpha: 0.95 })
    .stroke({ color: accent, width: 3 });
  marker.addChild(halo);

  const icon = new Graphics();
  if (isOasis) {
    icon.circle(0, 1, 6).fill(accent);
    icon.rect(-1.2, 2, 2.4, 7).fill("#74502d");
    icon.circle(-5, -3, 4).fill("#5d8d45");
    icon.circle(4, -4, 4).fill("#6f9d4f");
  } else {
    icon
      .rect(-8, -3, 16, 10)
      .fill(accent)
      .poly([-10, -3, 0, -11, 10, -3])
      .fill(accent)
      .rect(-3, 1, 6, 7)
      .fill(map.village)
      .rect(-10, -7, 4, 7)
      .fill(accent)
      .rect(6, -7, 4, 7)
      .fill(accent);
  }
  marker.addChild(icon);
  marker.position.set(TILE_SIZE / 2, TILE_SIZE / 2);
  return marker;
}

function createTileDisplay(
  tile: WorldMapTile,
  onSelect: (tile: WorldMapTile) => void,
  onHover: (tile: WorldMapTile | null) => void,
  isDragged: () => boolean,
) {
  const map = gameTokens.colors.map;
  const container = new Container();
  container.eventMode = "static";
  container.cursor = "pointer";
  container.hitArea = new Rectangle(0, 0, TILE_SIZE, TILE_SIZE);

  const base = new Graphics()
    .roundRect(0, 0, TILE_SIZE, TILE_SIZE, 7)
    .fill(terrainColor(tile.terrain, tile.visualVariant))
    .stroke({ color: map.tileBorder, width: 1, alpha: 0.72 });
  container.addChild(base);

  const decoration = new Graphics();
  drawTerrainDecoration(tile, decoration);
  container.addChild(decoration);

  if (tile.resourceLayout === "3-3-3-9" || tile.resourceLayout === "1-1-1-15") {
    const isFifteenCropper = tile.resourceLayout === "1-1-1-15";
    const badge = new Graphics()
      .circle(TILE_SIZE - 11, 11, 9)
      .fill(isFifteenCropper ? "#f2d55d" : "#d9b7ee")
      .stroke({ color: map.village, width: 2 });
    container.addChild(badge);

    const label = new Text({
      text: isFifteenCropper ? "15" : "9",
      style: new TextStyle({
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: 9,
        fontWeight: "800",
        fill: "#3e4734",
      }),
    });
    label.anchor.set(0.5);
    label.position.set(TILE_SIZE - 11, 11.5);
    container.addChild(label);
  }

  if (tile.occupant) {
    container.addChild(createVillageMarker(tile));
  }

  const hover = new Graphics()
    .roundRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2, 7)
    .fill(map.hover)
    .stroke({ color: map.village, width: 2, alpha: 0.72 });
  hover.visible = false;
  container.addChild(hover);

  container.on("pointerover", () => {
    hover.visible = true;
    onHover(tile);
  });
  container.on("pointerout", () => {
    hover.visible = false;
    onHover(null);
  });
  container.on("pointertap", () => {
    if (!isDragged()) onSelect(tile);
  });

  return container;
}

function coordinateToWorldPosition(bounds: MapBounds, x: number, y: number) {
  return {
    x: (x - bounds.minX) * TILE_STEP + TILE_SIZE / 2,
    y: (y - bounds.minY) * TILE_STEP + TILE_SIZE / 2,
  };
}

function setScaleAt(runtime: Runtime, nextScale: number, screenX: number, screenY: number) {
  const oldScale = runtime.scale;
  const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
  const localX = (screenX - runtime.world.x) / oldScale;
  const localY = (screenY - runtime.world.y) / oldScale;

  runtime.scale = clampedScale;
  runtime.world.scale.set(clampedScale);
  runtime.world.position.set(
    screenX - localX * clampedScale,
    screenY - localY * clampedScale,
  );
}

function centerRuntimeOn(runtime: Runtime, x: number, y: number) {
  const position = coordinateToWorldPosition(runtime.bounds, x, y);
  runtime.world.position.set(
    runtime.app.screen.width / 2 - position.x * runtime.scale,
    runtime.app.screen.height / 2 - position.y * runtime.scale,
  );
}

function bindDomNavigation(runtime: Runtime) {
  const canvas = runtime.app.canvas;
  let pointerId: number | null = null;
  let previousX = 0;
  let previousY = 0;

  canvas.style.touchAction = "none";

  const onPointerDown = (event: PointerEvent) => {
    pointerId = event.pointerId;
    previousX = event.clientX;
    previousY = event.clientY;
    runtime.dragged = false;
    canvas.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return;

    const deltaX = event.clientX - previousX;
    const deltaY = event.clientY - previousY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 2) runtime.dragged = true;

    runtime.world.x += deltaX;
    runtime.world.y += deltaY;
    previousX = event.clientX;
    previousY = event.clientY;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return;
    pointerId = null;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const bounds = canvas.getBoundingClientRect();
    const screenX = event.clientX - bounds.left;
    const screenY = event.clientY - bounds.top;
    const factor = event.deltaY < 0 ? 1.12 : 0.89;
    setScaleAt(runtime, runtime.scale * factor, screenX, screenY);
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  return () => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
    canvas.removeEventListener("wheel", onWheel);
  };
}

export const WorldMapCanvas = forwardRef<WorldMapCanvasHandle, WorldMapCanvasProps>(
  function WorldMapCanvas(
    { tiles, bounds, selectedTileId, initialCenter, onSelectTile, onHoverTile },
    ref,
  ) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const runtimeRef = useRef<Runtime | null>(null);
    const boundsRef = useRef(bounds);
    const initialCenterRef = useRef(initialCenter);
    const onSelectRef = useRef(onSelectTile);
    const onHoverRef = useRef(onHoverTile);
    const [isReady, setIsReady] = useState(false);

    boundsRef.current = bounds;
    initialCenterRef.current = initialCenter;
    onSelectRef.current = onSelectTile;
    onHoverRef.current = onHoverTile;

    useImperativeHandle(ref, () => ({
      zoomIn() {
        const runtime = runtimeRef.current;
        if (!runtime) return;
        setScaleAt(
          runtime,
          runtime.scale * 1.18,
          runtime.app.screen.width / 2,
          runtime.app.screen.height / 2,
        );
      },
      zoomOut() {
        const runtime = runtimeRef.current;
        if (!runtime) return;
        setScaleAt(
          runtime,
          runtime.scale * 0.84,
          runtime.app.screen.width / 2,
          runtime.app.screen.height / 2,
        );
      },
      resetView() {
        const runtime = runtimeRef.current;
        if (!runtime) return;
        runtime.scale = 0.78;
        runtime.world.scale.set(runtime.scale);
        const center = initialCenterRef.current ?? {
          x: Math.round((runtime.bounds.minX + runtime.bounds.maxX) / 2),
          y: Math.round((runtime.bounds.minY + runtime.bounds.maxY) / 2),
        };
        centerRuntimeOn(runtime, center.x, center.y);
      },
      centerOn(x, y) {
        const runtime = runtimeRef.current;
        if (!runtime) return;
        centerRuntimeOn(runtime, x, y);
      },
    }));

    useEffect(() => {
      const host = hostRef.current;
      if (!host) return undefined;

      const app = new Application();
      let cancelled = false;
      let initialized = false;

      void app
        .init({
          resizeTo: host,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          backgroundColor: gameTokens.colors.map.canvas,
          preference: "webgl",
          powerPreference: "high-performance",
        })
        .then(() => {
          initialized = true;
          if (cancelled) {
            app.destroy({ removeView: true }, { children: true });
            return;
          }

          host.appendChild(app.canvas);
          app.stage.eventMode = "static";
          app.stage.hitArea = app.screen;

          const world = new Container();
          const selection = new Graphics();
          world.addChild(selection);
          app.stage.addChild(world);

          const runtime: Runtime = {
            app,
            world,
            selection,
            tilePositions: new Map(),
            bounds: boundsRef.current,
            scale: 0.78,
            dragged: false,
            hasInitialView: false,
            cleanupDomEvents: () => undefined,
          };
          runtime.cleanupDomEvents = bindDomNavigation(runtime);
          runtimeRef.current = runtime;
          setIsReady(true);
        });

      return () => {
        cancelled = true;
        const runtime = runtimeRef.current;
        if (runtime?.app === app) {
          runtime.cleanupDomEvents();
          runtimeRef.current = null;
        }
        if (initialized) {
          app.destroy({ removeView: true }, { children: true });
        }
      };
    }, []);

    useEffect(() => {
      const runtime = runtimeRef.current;
      if (!runtime || !isReady) return;

      runtime.bounds = bounds;
      runtime.tilePositions.clear();

      for (const child of [...runtime.world.children]) {
        if (child !== runtime.selection) {
          runtime.world.removeChild(child);
          child.destroy({ children: true });
        }
      }

      for (const tile of tiles) {
        const localX = (tile.x - bounds.minX) * TILE_STEP;
        const localY = (tile.y - bounds.minY) * TILE_STEP;
        const display = createTileDisplay(
          tile,
          (selected) => onSelectRef.current(selected),
          (hovered) => onHoverRef.current?.(hovered),
          () => runtime.dragged,
        );
        display.position.set(localX, localY);
        runtime.tilePositions.set(tile.id, { x: localX, y: localY });
        runtime.world.addChildAt(display, runtime.world.children.length - 1);
      }

      if (!runtime.hasInitialView) {
        runtime.world.scale.set(runtime.scale);
        const center = initialCenterRef.current ?? {
          x: Math.round((bounds.minX + bounds.maxX) / 2),
          y: Math.round((bounds.minY + bounds.maxY) / 2),
        };
        centerRuntimeOn(runtime, center.x, center.y);
        runtime.hasInitialView = true;
      }
    }, [bounds, isReady, tiles]);

    useEffect(() => {
      const runtime = runtimeRef.current;
      if (!runtime || !isReady) return;

      runtime.selection.clear();
      if (selectedTileId === null) return;

      const position = runtime.tilePositions.get(selectedTileId);
      if (!position) return;

      runtime.selection
        .roundRect(position.x - 2, position.y - 2, TILE_SIZE + 4, TILE_SIZE + 4, 9)
        .stroke({ color: gameTokens.colors.map.selection, width: 4 });
    }, [isReady, selectedTileId, tiles]);

    return (
      <Box ref={hostRef} className={styles.root} aria-label="Interactive world map">
        {!isReady ? (
          <div className={styles.loading}>
            <CircularProgress size={34} />
          </div>
        ) : null}
        <div className={styles.coordinateHint}>Drag to pan · Scroll to zoom</div>
      </Box>
    );
  },
);
