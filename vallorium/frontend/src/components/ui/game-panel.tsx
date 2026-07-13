import { Paper } from "@mui/material";
import type { PaperProps } from "@mui/material";

export function GamePanel(props: PaperProps) {
  return <Paper variant="outlined" {...props} />;
}
