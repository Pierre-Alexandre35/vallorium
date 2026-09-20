import { useEffect, useState } from "react";

import type { VillageRow } from "@/features/villages/types/village";
import { projectResources } from "@/features/villages/utils/project-resources";

export function useLiveResources(village: VillageRow) {
  const [now, setNow] = useState(() => performance.now());

  useEffect(() => {
    const refresh = () => setNow(performance.now());
    const timer = window.setInterval(refresh, 1000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  // The local monotonic clock avoids client/server wall-clock skew. Every
  // response establishes a new baseline, even if its integer balances match.
  return projectResources(village, now);
}
