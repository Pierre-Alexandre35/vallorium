import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
} from "@mui/material";
import type { VillageRow } from "../types/village";

type Props = {
  villages: VillageRow[];
};

function getValue(record: Record<string, number>, key: string) {
  return record[key] ?? 0;
}

export function VillagesTable({ villages }: Props) {
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Stack spacing={0.5} sx={{ p: 3, pb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Your villages
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Production per hour and current balances for each village.
        </Typography>
      </Stack>

      <TableContainer>
        <Table sx={{ minWidth: 960 }}>
          <TableHead>
            <TableRow>
              <TableCell>Village</TableCell>
              <TableCell>Coords</TableCell>
              <TableCell align="right">Population</TableCell>
              <TableCell align="right">Wood / h</TableCell>
              <TableCell align="right">Clay / h</TableCell>
              <TableCell align="right">Iron / h</TableCell>
              <TableCell align="right">Corn / h</TableCell>
              <TableCell align="right">Wood</TableCell>
              <TableCell align="right">Clay</TableCell>
              <TableCell align="right">Iron</TableCell>
              <TableCell align="right">Corn</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {villages.map((village) => (
              <TableRow key={village.id} hover>
                <TableCell>{village.name}</TableCell>
                <TableCell>{village.coordinates}</TableCell>
                <TableCell align="right">{village.population}</TableCell>
                <TableCell align="right">
                  {getValue(village.production, "wood")}
                </TableCell>
                <TableCell align="right">
                  {getValue(village.production, "clay")}
                </TableCell>
                <TableCell align="right">
                  {getValue(village.production, "iron")}
                </TableCell>
                <TableCell align="right">
                  {getValue(village.production, "corn")}
                </TableCell>
                <TableCell align="right">
                  {getValue(village.resources, "wood")}
                </TableCell>
                <TableCell align="right">
                  {getValue(village.resources, "clay")}
                </TableCell>
                <TableCell align="right">
                  {getValue(village.resources, "iron")}
                </TableCell>
                <TableCell align="right">
                  {getValue(village.resources, "corn")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
