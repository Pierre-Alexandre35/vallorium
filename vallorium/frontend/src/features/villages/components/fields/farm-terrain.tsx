import { useId } from "react";

import { farmFieldLayout } from "@/features/villages/components/fields/farm-field-layout";
import {
  getFieldDecorations,
  getParcelPatternId,
  getParcelPoints,
} from "@/features/villages/components/fields/farm-field-geometry";
import {
  FieldDecorationArt,
  ParcelPatterns,
  SceneTrees,
  VillageCluster,
} from "@/features/villages/components/fields/farm-terrain-art";
import styles from "@/features/villages/components/fields/farm-terrain.module.css";
import type { ResourceKey } from "@/features/villages/types/village";

interface FarmTerrainPlot {
  farmNumber: number;
  resource: ResourceKey;
  level: number;
  upgrading: boolean;
}

interface FarmTerrainProps {
  plots: FarmTerrainPlot[];
  selectedFarmNumber: number;
  onSelectFarm: (farmNumber: number) => void;
}

export function FarmTerrain({
  plots,
  selectedFarmNumber,
  onSelectFarm,
}: FarmTerrainProps) {
  const idPrefix = useId().replaceAll(":", "");
  const plotsByNumber = new Map(plots.map((plot) => [plot.farmNumber, plot]));

  const parcels = farmFieldLayout.flatMap((slot) => {
    const plot = plotsByNumber.get(slot.farmNumber);
    return plot ? [{ slot, plot }] : [];
  });

  // Painted last so its outline isn't covered by neighbouring parcels.
  const paintOrder = [...parcels].sort(
    (a, b) =>
      Number(a.slot.farmNumber === selectedFarmNumber) -
      Number(b.slot.farmNumber === selectedFarmNumber),
  );

  const decorations = parcels
    .flatMap(({ slot, plot }) =>
      getFieldDecorations(slot, plot.level).map((decoration, index) => ({
        ...decoration,
        key: `${slot.farmNumber}-${index}`,
        resource: plot.resource,
      })),
    )
    .sort((a, b) => a.y - b.y);

  return (
    <svg className={styles.terrain} viewBox="0 0 100 100" aria-hidden="true">
      <ParcelPatterns idPrefix={idPrefix} />
      <SceneTrees />

      {paintOrder.map(({ slot, plot }) => (
        <polygon
          key={slot.farmNumber}
          className={styles.parcel}
          data-selected={slot.farmNumber === selectedFarmNumber}
          data-upgrading={plot.upgrading}
          points={getParcelPoints(slot)}
          fill={`url(#${getParcelPatternId(idPrefix, plot.resource)})`}
          onClick={() => onSelectFarm(slot.farmNumber)}
        />
      ))}

      <g className={styles.decorations}>
        {decorations.map(({ key, ...decoration }) => (
          <FieldDecorationArt key={key} {...decoration} />
        ))}
        <VillageCluster />
      </g>
    </svg>
  );
}
