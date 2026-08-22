export type FarmRing = "outer" | "inner";

export interface FarmFieldLayoutSlot {
  farmNumber: number;
  ring: FarmRing;
  angle: number;
  radius: number;
}

export const farmRingRadii: Record<
  FarmRing,
  { inner: number; outer: number; segmentAngle: number }
> = {
  outer: { inner: 31, outer: 48, segmentAngle: 30 },
  inner: { inner: 18, outer: 31, segmentAngle: 60 },
};

const outerSlots: FarmFieldLayoutSlot[] = Array.from(
  { length: 12 },
  (_, index) => ({
    farmNumber: index + 1,
    ring: "outer",
    angle: -120 + index * 30,
    radius: 39.5,
  }),
);

const innerSlots: FarmFieldLayoutSlot[] = Array.from(
  { length: 6 },
  (_, index) => ({
    farmNumber: index + 13,
    ring: "inner",
    angle: -120 + index * 60,
    radius: 24.5,
  }),
);

export const farmFieldLayout: FarmFieldLayoutSlot[] = [
  ...outerSlots,
  ...innerSlots,
];

export function getFarmFieldPosition(slot: FarmFieldLayoutSlot) {
  const angleInRadians = (slot.angle * Math.PI) / 180;

  return {
    left: `${50 + Math.cos(angleInRadians) * slot.radius}%`,
    top: `${50 + Math.sin(angleInRadians) * slot.radius}%`,
  };
}
