import { useEffect, useState } from "react";

import type { ResourceKey, VillageRow } from "@/features/villages/types/village";

const keys: ResourceKey[] = ["wood", "clay", "iron", "crop"];

export function useLiveResources(village: VillageRow) {
  const [resources, setResources] = useState(village.resources);

  useEffect(() => {
    setResources(village.resources);
  }, [village.id, village.resources]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setResources((current) => {
        const next = { ...current };
        keys.forEach((key) => {
          const perSecond = (village.production[key] ?? 0) / 3600;
          next[key] = Math.min(village.capacities[key] ?? Number.MAX_SAFE_INTEGER, (current[key] ?? 0) + perSecond);
        });
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [village.capacities, village.production]);

  return resources;
}
