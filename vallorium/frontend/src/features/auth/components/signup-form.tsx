import { useEffect, useState, type FormEvent } from "react";

import { Alert, Box, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import { getTribes } from "@/features/auth/api/get-tribes";
import { SignupAccountStep } from "@/features/auth/components/signup-account-step";
import { SignupStepper } from "@/features/auth/components/signup-stepper";
import { SignupTribeStep } from "@/features/auth/components/signup-tribe-step";
import { useSignupForm } from "@/features/auth/hooks/use-signup-form";
import type { TribeOption } from "@/features/auth/types/auth";
import { gameTokens } from "@/theme";

type SignupStep = 0 | 1;

export function SignupForm() {
  const {
    values,
    error,
    isSubmitting,
    validateAccountStep,
    handleSubmit,
    updateField,
  } = useSignupForm();

  const [step, setStep] = useState<SignupStep>(0);
  const [tribes, setTribes] = useState<TribeOption[]>([]);
  const [isLoadingTribes, setIsLoadingTribes] = useState(true);
  const [tribesError, setTribesError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTribes() {
      try {
        const data = await getTribes(controller.signal);

        if (!controller.signal.aborted) {
          setTribes(data);
          setTribesError(null);
        }
      } catch {
        if (!controller.signal.aborted) {
          setTribesError("Unable to load tribes.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingTribes(false);
        }
      }
    }

    void loadTribes();

    return () => {
      controller.abort();
    };
  }, []);

  function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (validateAccountStep()) {
      setStep(1);
    }
  }

  function handleBack() {
    setStep(0);
  }

  return (
    <Box sx={{ mb: 0.5 }}>
      <Stack
        component="form"
        onSubmit={step === 0 ? handleAccountSubmit : handleSubmit}
        spacing={2}
      >
        <Box>
          <Typography variant="h4">
            {step === 0 ? "Found your first village." : "Choose your people."}
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {step === 0
              ? "Create your account and begin with a protected settlement."
              : "Your tribe shapes your strengths and play style."}
          </Typography>
        </Box>

        <SignupStepper step={step} />

        {error ? <Alert severity="error">{error}</Alert> : null}


        {step === 0 ? (
          <SignupAccountStep
            values={values}
            onEmailChange={(value) => updateField("email", value)}
            onPasswordChange={(value) => updateField("password", value)}
            onConfirmPasswordChange={(value) =>
              updateField("confirmPassword", value)
            }
          />
        ) : (
          <SignupTribeStep
            tribes={tribes}
            selectedTribeId={values.tribeId}
            isLoading={isLoadingTribes}
            isSubmitting={isSubmitting}
            loadError={tribesError}
            onSelect={(tribeId) => updateField("tribeId", tribeId)}
            onBack={handleBack}
          />
        )}

        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
        >
          Already have an account?{" "}
          <Typography
            component={RouterLink}
            to="/login"
            color="primary.main"
            fontWeight={gameTokens.typography.weight.bold}
            sx={{ textDecoration: "none" }}
          >
            Sign in
          </Typography>
        </Typography>
      </Stack>
    </Box>
  );
}
