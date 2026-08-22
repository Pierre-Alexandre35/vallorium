import { Card, CardContent, Grid, Typography } from "@mui/material";

import type {
  ResourceKey,
  VillageRow,
} from "@/features/villages/types/village";
import { gameTokens } from "@/theme";

type Props = {
  villages: VillageRow[];
};

type ResourceSource = "production" | "resources";

function sumResource(
  villages: VillageRow[],
  resource: ResourceKey,
  source: ResourceSource,
): number {
  return villages.reduce(
    (total, village) => total + village[source][resource],
    0,
  );
}

function cardItems(villages: VillageRow[]) {
  return [
    {
      label: "Villages",
      value: villages.length,
    },
    {
      label: "Total population",
      value: villages.reduce(
        (total, village) => total + village.population,
        0,
      ),
    },
    {
      label: "Wood / h",
      value: sumResource(villages, "wood", "production"),
    },
    {
      label: "Clay / h",
      value: sumResource(villages, "clay", "production"),
    },
    {
      label: "Iron / h",
      value: sumResource(villages, "iron", "production"),
    },
    {
      label: "Crop / h",
      value: sumResource(villages, "crop", "production"),
    },
  ];
}

export function VillageSummaryCards({ villages }: Props) {
  const items = cardItems(villages);

  return (
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid
          key={item.label}
          size={{ xs: 12, sm: 6, md: 4, lg: 2 }}
        >
          <Card
            variant="outlined"
            sx={{ height: "100%" }}
          >
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
                gutterBottom
              >
                {item.label}
              </Typography>

              <Typography
                variant="h6"
                fontWeight={gameTokens.typography.weight.medium}
              >
                {item.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
