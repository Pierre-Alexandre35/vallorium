import type { ReactNode } from "react";

import { getParcelPatternId } from "@/features/villages/components/fields/farm-field-geometry";
import {
  resourceKeys,
  resourceMeta,
} from "@/features/villages/config/resource-meta";
import type { ResourceKey } from "@/features/villages/types/village";
import { gameTokens } from "@/theme";

const { villageMap, map } = gameTokens.colors;

export function ParcelPatterns({ idPrefix }: { idPrefix: string }) {
  return (
    <defs>
      {resourceKeys.map((resource) => {
        const { base, light, dark } = resourceMeta[resource].terrain;

        return (
          <pattern
            key={resource}
            id={getParcelPatternId(idPrefix, resource)}
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
          >
            <rect width="5" height="5" fill={base} />
            <circle cx="1.3" cy="1.4" r=".8" fill={light} />
            <circle cx="3.8" cy="3.7" r=".7" fill={dark} />
          </pattern>
        );
      })}
    </defs>
  );
}

function decorationArt(resource: ResourceKey): ReactNode {
  const { detail } = resourceMeta[resource].terrain;

  switch (resource) {
    case "wood":
      return <polygon points="-1.3,.6 0,-2.4 1.3,.6" fill={detail} />;
    case "clay":
      return <ellipse rx="1.5" ry=".8" fill={detail} />;
    case "iron":
      return <polygon points="-1.6,.7 -.3,-1.6 1.2,.7" fill={detail} />;
    case "crop":
      return <path d="M-1 .5 Q-.8 -1.2 0 -1.5 Q.8 -1.2 1 .5 Z" fill={detail} />;
  }
}

function Hut({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="-1.5" y="-1" width="3" height="1.9" fill={map.village} />
      <polygon points="-2,-1 0,-2.7 2,-1" fill={villageMap.roof} />
    </g>
  );
}

interface FieldDecorationArtProps {
  resource: ResourceKey;
  x: number;
  y: number;
  isHut: boolean;
}

export function FieldDecorationArt({
  resource,
  x,
  y,
  isHut,
}: FieldDecorationArtProps) {
  if (isHut) {
    return <Hut x={x} y={y} />;
  }

  return <g transform={`translate(${x} ${y})`}>{decorationArt(resource)}</g>;
}

export function VillageCluster() {
  return (
    <g>
      <circle cx="50" cy="50" r="17" fill={villageMap.centerGround} />
      <rect x="45" y="44" width="10" height="9" fill={map.village} />
      <polygon points="43.8,44 50,38.5 56.2,44" fill={villageMap.roof} />
      <rect x="48.8" y="49" width="2.4" height="4" fill={villageMap.timber} />
      <Hut x={40.5} y={54} scale={1.4} />
      <Hut x={59.5} y={54} scale={1.4} />
    </g>
  );
}

// The ring is a centred square; the scene extends past it on both sides.
const SCENE_MIN_X = -40;
const SCENE_WIDTH = 180;

const SCENE_TREES = Array.from({ length: 150 }, (_, index) => ({
  x: SCENE_MIN_X + (((index + 1) * 0.618) % 1) * SCENE_WIDTH,
  y: (((index + 1) * 0.755) % 1) * 100,
})).filter(({ x, y }) => Math.hypot(x - 50, y - 50) > 51);

export function SceneTrees() {
  return (
    <g>
      {SCENE_TREES.map(({ x, y }) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <circle cy="-.6" r="1.8" fill={villageMap.treeDark} />
          <circle cx=".5" cy="-1.1" r=".9" fill={villageMap.treeLight} />
        </g>
      ))}
    </g>
  );
}
