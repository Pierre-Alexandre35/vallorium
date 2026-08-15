import { Step, StepLabel, Stepper } from "@mui/material";

import { gameTokens } from "@/theme";

type SignupStep = 0 | 1;

interface SignupStepperProps {
  step: SignupStep;
}

const STEPS = ["Account", "Tribe"] as const;

export function SignupStepper({ step }: SignupStepperProps) {
  return (
    <Stepper
      activeStep={step}
      alternativeLabel
      sx={{
        py: 0.5,
        "& .MuiStepLabel-label": {
          mt: 0.5,
          fontSize: 12,
          fontWeight: gameTokens.typography.weight.medium,
          color: "text.secondary",
        },
        "& .MuiStepLabel-label.Mui-active, & .MuiStepLabel-label.Mui-completed": {
          color: "primary.main",
          fontWeight: gameTokens.typography.weight.bold,
        },
        "& .MuiStepIcon-root": {
          color: gameTokens.colors.border.default,
        },
        "& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed": {
          color: "primary.main",
        },
        "& .MuiStepConnector-line": {
          borderColor: gameTokens.colors.border.default,
        },
        "& .MuiStepConnector-root.Mui-active .MuiStepConnector-line, & .MuiStepConnector-root.Mui-completed .MuiStepConnector-line": {
          borderColor: "primary.main",
        },
      }}
    >
      {STEPS.map((label) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
