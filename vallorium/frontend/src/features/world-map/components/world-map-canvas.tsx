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

import {
  isSettleable,
  RESOURCE_LAYOUT_VALUES,
  type MapBounds,
  type TerrainType,
  type TileOccupant,
  type WorldMapTile,
} from "@/features/world-map/types/map";
import { gameTokens } from "@/theme";
import styles from "@/features/world-map/components/world-map-canvas.module.css";

const TILE_SIZE = 58;
const TILE_GAP = 0;
const TILE_STEP = TILE_SIZE + TILE_GAP;
const MIN_SCALE = 0.42;
const MAX_SCALE = 1.65;
const MIN_BADGED_CROP_FIELDS = 9;

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

const TERRAIN_COLORS: Record<TerrainType, string> = {
  forest: gameTokens.colors.map.forest,
  mountain: gameTokens.colors.map.mountain,
  lake: gameTokens.colors.map.lake,
  clay: gameTokens.colors.map.clay,
  iron: gameTokens.colors.map.iron,
  meadow: gameTokens.colors.map.meadow,
};

const HOUSE_OFFSETS = [
  [-3, -13],
  [16, -12],
  [3, 4],
  [-17, 14],
  [18, 10],
  [1, 21],
] as const;

function getHouseCount(population = 0) {
  if (population > 200) return 6;
  return population > 75 ? 4 : 2;
}

function drawTree(graphics: Graphics, x: number, y: number, scale = 1) {
  const map = gameTokens.colors.map;
  graphics
    .rect(x - 1.3 * scale, y + 5 * scale, 2.6 * scale, 5 * scale)
    .fill("#6f5130");
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
    .fill(map.forestLight);
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
        .fill(map.ironDark)
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
        .fill({ color: map.clayDark, alpha: 0.9 })
        .ellipse(38, 24, 12, 8)
        .fill({ color: map.clayLight, alpha: 0.9 })
        .moveTo(14, 34)
        .lineTo(29, 30)
        .stroke({ color: "#8d4f3e", width: 2, alpha: 0.55 });
      break;
    case "iron":
      graphics
        .poly([10, 43, 18, 20, 30, 16, 35, 38])
        .fill(map.ironDark)
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

function drawOasis(graphics: Graphics) {
  const map = gameTokens.colors.map;
  graphics
    .ellipse(0, 6, 20, 12)
    .fill(map.lake)
    .stroke({ color: map.centerGround, width: 3 });
  drawTree(graphics, -8, -8, 1);
}

function drawVillage(graphics: Graphics, occupant: TileOccupant) {
  const map = gameTokens.colors.map;
  const half = TILE_SIZE / 2 - 2;

  graphics
    .rect(-half, -half, half * 2, half * 2)
    .fill(map.centerGround)
    .stroke({
      color: occupant.isCurrentPlayer ? map.villageCurrent : map.villageOther,
      width: 4,
    });

  for (const [x, y] of HOUSE_OFFSETS.slice(
    0,
    getHouseCount(occupant.population),
  )) {
    graphics
      .rect(x - 7, y - 4, 14, 9)
      .fill(map.village)
      .poly([x - 9, y - 4, x, y - 11, x + 9, y - 4])
      .fill(map.villageRoof);
  }
}

function createOccupantDisplay(occupant: TileOccupant) {
  const graphics = new Graphics();

  if (occupant.type === "oasis") {
    drawOasis(graphics);
  } else {
    drawVillage(graphics, occupant);
  }

  graphics.position.set(TILE_SIZE / 2, TILE_SIZE / 2);
  return graphics;
}

function createCropBadge(cropFields: number) {
  const map = gameTokens.colors.map;
  const badge = new Container();

  badge.addChild(
    new Graphics()
      .circle(0, 0, 12)
      .fill(map.village)
      .circle(10, -10, 6)
      .fill(map.crop)
      .stroke({ color: map.village, width: 1.5 }),
  );

  const label = new Text({
    text: String(cropFields),
    style: new TextStyle({
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: 12,
      fontWeight: "800",
      fill: gameTokens.colors.text.primary,
    }),
  });
  label.anchor.set(0.5);
  badge.addChild(label);

  badge.position.set(TILE_SIZE / 2, TILE_SIZE / 2);
  return badge;
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

  const terrainColor = TERRAIN_COLORS[tile.terrain];
  const base = new Graphics()
    .rect(0, 0, TILE_SIZE, TILE_SIZE)
    .fill(terrainColor)
    .stroke({ color: terrainColor, width: 1 });
  container.addChild(base);

  const decoration = new Graphics();
  drawTerrainDecoration(tile, decoration);
  container.addChild(decoration);

  const cropFields = RESOURCE_LAYOUT_VALUES[tile.resourceLayout].crop;

  if (tile.occupant) {
    container.addChild(createOccupantDisplay(tile.occupant));
  } else if (cropFields >= MIN_BADGED_CROP_FIELDS && isSettleable(tile)) {
    container.addChild(createCropBadge(cropFields));
  }

  const hover = new Graphics()
    .rect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2)
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

function setScaleAt(
  runtime: Runtime,
  nextScale: number,
  screenX: number,
  screenY: number,
) {
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

export const WorldMapCanvas = forwardRef<
  WorldMapCanvasHandle,
  WorldMapCanvasProps
>(function WorldMapCanvas(
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
        backgroundColor: gameTokens.colors.map.terrainGround,
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
      .roundRect(
        position.x - 2,
        position.y - 2,
        TILE_SIZE + 4,
        TILE_SIZE + 4,
        9,
      )
      .stroke({ color: gameTokens.colors.map.selection, width: 4 });
  }, [isReady, selectedTileId, tiles]);

  return (
    <Box
      ref={hostRef}
      className={styles.root}
      aria-label="Interactive world map"
    >
      {!isReady ? (
        <div className={styles.loading}>
          <CircularProgress size={34} />
        </div>
      ) : null}
      <div className={styles.coordinateHint}>Drag to pan · Scroll to zoom</div>
    </Box>
  );
});
