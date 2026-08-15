import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import { TribeChoiceCard } from "@/features/auth/components/tribe-choice-card";
import type { TribeOption } from "@/features/auth/types/auth";

interface SignupTribeStepProps {
  tribes: TribeOption[];
  selectedTribeId: number | null;
  isLoading: boolean;
  isSubmitting: boolean;
  loadError: string | null;
  onSelect: (tribeId: number) => void;
  onBack: () => void;
}

export function SignupTribeStep({
  tribes,
  selectedTribeId,
  isLoading,
  isSubmitting,
  loadError,
  onSelect,
  onBack,
}: SignupTribeStepProps) {
  if (isLoading) {
    return (
      <Stack alignItems="center" spacing={1.5} sx={{ py: 5 }}>
        <CircularProgress size={30} />
        <Typography variant="body2" color="text.secondary">
          Gathering the tribes...
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {loadError ? (
        <Alert severity="error">{loadError}</Alert>
      ) : tribes.length === 0 ? (
        <Alert severity="warning">
          No tribes are available right now. Please try again later.
        </Alert>
      ) : (
        <Stack spacing={1.25}>
          {tribes.map((tribe) => (
            <TribeChoiceCard
              key={tribe.id}
              tribe={tribe}
              selected={selectedTribeId === tribe.id}
              onSelect={() => onSelect(tribe.id)}
            />
          ))}
        </Stack>
      )}

      <Stack direction="row" spacing={1.5}>
        <Button
          type="button"
          variant="outlined"
          size="large"
          onClick={onBack}
          startIcon={<ArrowBackRoundedIcon />}
        >
          Back
        </Button>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={
            isSubmitting || selectedTribeId === null || tribes.length === 0
          }
          sx={{ flex: 1 }}
        >
          {isSubmitting ? (
            <CircularProgress size={23} color="inherit" />
          ) : (
            "Create my village"
          )}
        </Button>
      </Stack>
    </Stack>
  );
}
