import { Box, Stack, Typography } from "@mui/material";

import { ResourceIcon } from "@/features/villages/components/resources/resource-icon";
import {
  resourceMeta,
  toResourceKey,
} from "@/features/villages/config/resource-meta";
import type { ResourceCost } from "@/features/villages/types/village";
import { gameTokens } from "@/theme";

// Read by screen readers ("Lumber 70"), invisible on screen.
const visuallyHidden = {
  position: "absolute",
  width: "1px",
  height: "1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;

interface UpgradeCostProps {
  costs: ResourceCost[];
}

/** Compact "icon + amount" row for the resources an upgrade costs. */
export function UpgradeCost({ costs }: UpgradeCostProps) {
  if (costs.length === 0) return null;

  return (
    <Stack
      component="ul"
      aria-label="Upgrade cost"
      direction="row"
      flexWrap="wrap"
      columnGap={1.5}
      rowGap={0.5}
      sx={{ listStyle: "none", m: 0, mt: 0.5, p: 0 }}
    >
      {costs.map((cost) => {
        const resource = toResourceKey(cost.resource_type);
        if (!resource) return null;

        return (
          <Stack
            component="li"
            key={cost.resource_id}
            direction="row"
            alignItems="center"
            spacing={0.5}
            title={resourceMeta[resource].label}
          >
            <ResourceIcon resource={resource} size={18} soft />
            <Typography
              variant="body2"
              fontWeight={gameTokens.typography.weight.heavy}
              sx={{ fontVariantNumeric: "tabular-nums" }}
            >
              <Box component="span" sx={visuallyHidden}>
                {resourceMeta[resource].label}{" "}
              </Box>
              {cost.amount.toLocaleString()}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
