import { useId } from "react";

import {
  farmFieldLayout,
  farmRingRadii,
} from "@/features/villages/components/fields/farm-field-layout";
import styles from "@/features/villages/components/fields/farm-terrain.module.css";
import { resourceMeta } from "@/features/villages/config/resource-meta";
import type { ResourceKey } from "@/features/villages/types/village";

interface FarmTerrainPlot {
  farmNumber: number;
  resource: ResourceKey;
}

interface FarmTerrainProps {
  plots: FarmTerrainPlot[];
  selectedFarmNumber: number;
  onSelectFarm: (farmNumber: number) => void;
}

interface Point {
  x: number;
  y: number;
}

function polarPoint(radius: number, angle: number): Point {
  const radians = (angle * Math.PI) / 180;

  return {
    x: 50 + radius * Math.cos(radians),
    y: 50 + radius * Math.sin(radians),
  };
}

function ringSegmentPath(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart = polarPoint(outerRadius, startAngle);
  const outerEnd = polarPoint(outerRadius, endAngle);
  const innerEnd = polarPoint(innerRadius, endAngle);
  const innerStart = polarPoint(innerRadius, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

export function FarmTerrain({
  plots,
  selectedFarmNumber,
  onSelectFarm,
}: FarmTerrainProps) {
  const idPrefix = useId().replaceAll(":", "");
  const plotsByNumber = new Map(
    plots.map((plot) => [plot.farmNumber, plot]),
  );

  return (
    <svg
      className={styles.terrain}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        {Object.entries(resourceMeta).map(([resource, meta]) => {
          const resourceKey = resource as ResourceKey;
          const gradientId = `${idPrefix}-${resourceKey}-gradient`;
          const patternId = `${idPrefix}-${resourceKey}-pattern`;

          return (
            <g key={resourceKey}>
              <linearGradient
                id={gradientId}
                x1="15"
                y1="10"
                x2="88"
                y2="92"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor={meta.terrain.light} />
                <stop offset="0.55" stopColor={meta.terrain.base} />
                <stop offset="1" stopColor={meta.terrain.dark} />
              </linearGradient>

              <pattern
                id={patternId}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform={
                  resourceKey === "clay"
                    ? "rotate(18)"
                    : resourceKey === "crop"
                      ? "rotate(-12)"
                      : undefined
                }
              >
                <rect width="6" height="6" fill={`url(#${gradientId})`} />

                {resourceKey === "wood" && (
                  <>
                    <circle
                      cx="1.5"
                      cy="1.7"
                      r="0.55"
                      fill="rgba(35,72,45,.2)"
                    />
                    <circle
                      cx="4.6"
                      cy="4.1"
                      r="0.7"
                      fill="rgba(255,255,255,.09)"
                    />
                  </>
                )}

                {resourceKey === "clay" && (
                  <>
                    <path
                      d="M -1 1 H 7"
                      stroke="rgba(112,59,38,.16)"
                      strokeWidth="0.45"
                    />
                    <path
                      d="M -1 4 H 7"
                      stroke="rgba(255,255,255,.1)"
                      strokeWidth="0.35"
                    />
                  </>
                )}

                {resourceKey === "iron" && (
                  <>
                    <path
                      d="M 0.8 4.8 L 2.2 2.2 L 3.7 4.7 Z"
                      fill="rgba(65,76,77,.14)"
                    />
                    <circle
                      cx="5"
                      cy="1.5"
                      r="0.65"
                      fill="rgba(255,255,255,.1)"
                    />
                  </>
                )}

                {resourceKey === "crop" && (
                  <>
                    <path
                      d="M 0 1.4 H 6 M 0 3.2 H 6 M 0 5 H 6"
                      stroke="rgba(93,111,34,.14)"
                      strokeWidth="0.42"
                    />
                    <path
                      d="M 1.2 0 V 6"
                      stroke="rgba(255,255,255,.08)"
                      strokeWidth="0.32"
                    />
                  </>
                )}
              </pattern>
            </g>
          );
        })}

        <radialGradient
          id={`${idPrefix}-center-ground`}
          cx="42%"
          cy="34%"
          r="72%"
        >
          <stop offset="0" stopColor="var(--farm-center-ground-light)" />
          <stop offset="0.68" stopColor="var(--farm-center-ground)" />
          <stop offset="1" stopColor="var(--farm-center-ground-dark)" />
        </radialGradient>
      </defs>

      <circle className={styles.outerGround} cx="50" cy="50" r="49" />

      {farmFieldLayout.map((slot) => {
        const plot = plotsByNumber.get(slot.farmNumber);

        if (!plot) {
          return null;
        }

        const ring = farmRingRadii[slot.ring];
        const halfSegment = ring.segmentAngle / 2;
        const path = ringSegmentPath(
          ring.inner,
          ring.outer,
          slot.angle - halfSegment,
          slot.angle + halfSegment,
        );
        const patternId = `${idPrefix}-${plot.resource}-pattern`;

        return (
          <path
            key={slot.farmNumber}
            className={styles.segment}
            data-selected={slot.farmNumber === selectedFarmNumber}
            d={path}
            fill={`url(#${patternId})`}
            onClick={() => onSelectFarm(slot.farmNumber)}
          />
        );
      })}

      <circle className={styles.outerEdge} cx="50" cy="50" r="48" />
      <circle className={styles.ringDivider} cx="50" cy="50" r="31" />
      <circle className={styles.centerRoad} cx="50" cy="50" r="18" />
      <circle
        className={styles.centerGround}
        cx="50"
        cy="50"
        r="15.2"
        fill={`url(#${idPrefix}-center-ground)`}
      />
    </svg>
  );
}
