import { useEffect, useState } from "react";

import type {
  ResourceKey,
  VillageRow,
} from "@/features/villages/types/village";

const keys: ResourceKey[] = ["wood", "clay", "iron", "crop"];

interface LiveResourcesState {
  villageId: VillageRow["id"];
  sourceResources: VillageRow["resources"];
  resources: VillageRow["resources"];
}

function createLiveResourcesState(village: VillageRow): LiveResourcesState {
  return {
    villageId: village.id,
    sourceResources: { ...village.resources },
    resources: { ...village.resources },
  };
}

function hasResourceSnapshotChanged(
  current: LiveResourcesState,
  village: VillageRow,
) {
  if (current.villageId !== village.id) {
    return true;
  }

  return keys.some(
    (key) => current.sourceResources[key] !== village.resources[key],
  );
}

export function useLiveResources(village: VillageRow) {
  const [state, setState] = useState<LiveResourcesState>(() =>
    createLiveResourcesState(village),
  );

  if (hasResourceSnapshotChanged(state, village)) {
    setState(createLiveResourcesState(village));
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      setState((current) => {
        const resources = { ...current.resources };

        keys.forEach((key) => {
          const perSecond = (village.production[key] ?? 0) / 3600;

          resources[key] = Math.min(
            village.capacities[key] ?? Number.MAX_SAFE_INTEGER,
            (current.resources[key] ?? 0) + perSecond,
          );
        });

        return {
          ...current,
          resources,
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [village.capacities, village.production]);

  return state.resources;
}
