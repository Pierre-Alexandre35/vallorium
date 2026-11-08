import {
  farmRingRadii,
  type FarmFieldLayoutSlot,
} from "@/features/villages/components/fields/farm-field-layout";
import type { ResourceKey } from "@/features/villages/types/village";

const ARC_STEP_DEGREES = 15;
const EDGE_JITTER = 1.5;
const MAX_DECORATIONS = 10;
const HUT_MIN_LEVEL = 5;

export interface FieldDecoration {
  x: number;
  y: number;
  isHut: boolean;
}

export function getParcelPatternId(idPrefix: string, resource: ResourceKey) {
  return `${idPrefix}-${resource}`;
}

function fraction(value: number): number {
  return value - Math.floor(value);
}

/** Deterministic, and shared by neighbouring parcels so their edges still meet. */
function edgeOffset(radius: number, angle: number): number {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  const noise = Math.sin(radius * 12.9 + normalizedAngle * 78.2) * 43758.5;

  return (fraction(noise) - 0.5) * EDGE_JITTER;
}

function toCartesian(radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;

  return {
    x: 50 + radius * Math.cos(radians),
    y: 50 + radius * Math.sin(radians),
  };
}

function parcelPoint(radius: number, angle: number): string {
  const { x, y } = toCartesian(radius + edgeOffset(radius, angle), angle);

  return `${x.toFixed(2)},${y.toFixed(2)}`;
}

export function getParcelPoints(slot: FarmFieldLayoutSlot): string {
  const { inner, outer, segmentAngle } = farmRingRadii[slot.ring];
  const start = slot.angle - segmentAngle / 2;
  const end = slot.angle + segmentAngle / 2;
  const points: string[] = [];

  for (let angle = start; angle <= end; angle += ARC_STEP_DEGREES) {
    points.push(parcelPoint(outer, angle));
  }
  for (let angle = end; angle >= start; angle -= ARC_STEP_DEGREES) {
    points.push(parcelPoint(inner, angle));
  }

  return points.join(" ");
}

/** More decorations appear on a field as it levels up. */
export function getFieldDecorations(
  slot: FarmFieldLayoutSlot,
  level: number,
): FieldDecoration[] {
  const { inner, outer, segmentAngle } = farmRingRadii[slot.ring];
  const count = Math.min(3 + level, MAX_DECORATIONS);

  return Array.from({ length: count }, (_, index) => {
    const step = index + 1;
    const radius =
      inner +
      2.4 +
      fraction(step * 0.755 + slot.farmNumber * 0.13) * (outer - inner - 4.2);
    const angle =
      slot.angle +
      (fraction(step * 0.618 + slot.farmNumber * 0.37) - 0.5) *
        (segmentAngle - 7);

    return {
      ...toCartesian(radius, angle),
      isHut: level >= HUT_MIN_LEVEL && index === 0,
    };
  });
}
