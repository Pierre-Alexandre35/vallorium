import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { register } from "@/features/auth/api/register";
import { cacheCurrentUser } from "@/features/auth/auth-query";
import type { RegisterFormValues } from "@/features/auth/types/auth";
import { getRequestErrorMessage } from "@/features/auth/utils/get-request-error-message";

const INITIAL_VALUES: RegisterFormValues = {
  email: "",
  password: "",
  confirmPassword: "",
  tribeId: null,
};

interface SignupRequest {
  email: string;
  password: string;
  tribeId: number;
  idempotencyKey: string;
}

export function useSignupForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [validationError, setValidationError] = useState<string | null>(null);
  const idempotencyKey = useRef(crypto.randomUUID());

  const signupMutation = useMutation({
    mutationFn: ({
      email,
      password,
      tribeId,
      idempotencyKey: requestIdempotencyKey,
    }: SignupRequest) =>
      register(
        { email, password, tribeId },
        requestIdempotencyKey,
      ),
    onSuccess: ({ user }) => {
      cacheCurrentUser(queryClient, user);
      navigate("/app", { replace: true });
    },
  });

  function validateAccountStep(): boolean {
    setValidationError(null);

    if (!values.email.trim()) {
      setValidationError("Enter your email address.");
      return false;
    }

    if (values.password.length < 8) {
      setValidationError("Use at least 8 characters for your password.");
      return false;
    }

    if (values.password !== values.confirmPassword) {
      setValidationError("The passwords do not match.");
      return false;
    }

    return true;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    if (!validateAccountStep()) {
      return;
    }

    if (values.tribeId === null) {
      setValidationError("Choose a tribe before continuing.");
      return;
    }

    signupMutation.mutate({
      email: values.email.trim(),
      password: values.password,
      tribeId: values.tribeId,
      idempotencyKey: idempotencyKey.current,
    });
  }

  function updateField<K extends keyof RegisterFormValues>(
    field: K,
    value: RegisterFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setValidationError(null);
    idempotencyKey.current = crypto.randomUUID();

    if (signupMutation.isError) {
      signupMutation.reset();
    }
  }

  return {
    values,
    error:
      validationError ??
      (signupMutation.error
        ? getRequestErrorMessage(
            signupMutation.error,
            "Unable to create your account.",
          )
        : null),
    isSubmitting: signupMutation.isPending,
    validateAccountStep,
    handleSubmit,
    updateField,
  };
}
