import type {
  ResourceKey,
  VillageRow,
} from "@/features/villages/types/village";

const keys: ResourceKey[] = ["wood", "clay", "iron", "crop"];

export function projectResources(village: VillageRow, now: number) {
  const elapsed = Math.max(0, now - village.receivedAt) / 1000;
  const resources = { ...village.resources };
  keys.forEach((key) => {
    resources[key] = Math.max(
      0,
      Math.min(
        village.capacities[key],
        village.resources[key] + (village.production[key] * elapsed) / 3600,
      ),
    );
  });
  return resources;
}
