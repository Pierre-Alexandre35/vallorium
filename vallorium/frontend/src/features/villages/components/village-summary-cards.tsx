import { Card, CardContent, Grid, Typography } from "@mui/material";
import type { VillageRow } from "../types/village";

type Props = {
  villages: VillageRow[];
};

function sum(
  villages: VillageRow[],
  key: string,
  source: "production" | "resources",
) {
  return villages.reduce(
    (total, village) => total + (village[source][key] ?? 0),
    0,
  );
}

const cardItems = (villages: VillageRow[]) => [
  { label: "Villages", value: villages.length },
  {
    label: "Total population",
    value: villages.reduce((acc, village) => acc + village.population, 0),
  },
  { label: "Wood / h", value: sum(villages, "wood", "production") },
  { label: "Clay / h", value: sum(villages, "clay", "production") },
  { label: "Iron / h", value: sum(villages, "iron", "production") },
  { label: "Corn / h", value: sum(villages, "corn", "production") },
];

export function VillageSummaryCards({ villages }: Props) {
  return (
    <Grid container spacing={2}>
      {cardItems(villages).map((item) => (
        <Grid key={item.label} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {item.label}
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {item.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
