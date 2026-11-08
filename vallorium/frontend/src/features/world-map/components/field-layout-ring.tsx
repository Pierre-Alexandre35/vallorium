import { getParcelPoints } from "@/features/villages/components/fields/farm-field-geometry";
import { farmFieldLayout } from "@/features/villages/components/fields/farm-field-layout";
import {
  resourceKeys,
  resourceMeta,
} from "@/features/villages/config/resource-meta";
import type { ResourceKey } from "@/features/villages/types/village";
import {
  RESOURCE_LAYOUT_VALUES,
  type ResourceLayoutCode,
} from "@/features/world-map/types/map";
import { gameTokens } from "@/theme";

const { map } = gameTokens.colors;

export function FieldLayoutRing({ layout }: { layout: ResourceLayoutCode }) {
  const counts = RESOURCE_LAYOUT_VALUES[layout];
  const resources = resourceKeys.flatMap((resource) =>
    Array<ResourceKey>(counts[resource]).fill(resource),
  );

  return (
    <svg
      viewBox="0 0 100 100"
      width={120}
      height={120}
      role="img"
      aria-label={`Field layout ${layout}`}
    >
      <circle cx="50" cy="50" r="49" fill={map.terrainGround} />
      {farmFieldLayout.map((slot, index) => (
        <polygon
          key={slot.farmNumber}
          points={getParcelPoints(slot)}
          fill={resourceMeta[resources[index]].terrain.base}
          stroke={map.forestDark}
          strokeWidth=".8"
        />
      ))}
      <circle cx="50" cy="50" r="17" fill={map.centerGround} />
    </svg>
  );
}
