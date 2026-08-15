import axios from "axios";
import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "@/features/auth/api/login";
import { register } from "@/features/auth/api/register";
import type { RegisterFormValues } from "@/features/auth/types/auth";

const INITIAL_VALUES: RegisterFormValues = {
  email: "",
  password: "",
  confirmPassword: "",
  tribeId: null,
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const detail = error.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (
          item &&
          typeof item === "object" &&
          "msg" in item &&
          typeof item.msg === "string"
        ) {
          return item.msg;
        }

        return "Invalid value";
      })
      .join(", ");
  }

  return fallback;
}

export function useSignupForm() {
  const navigate = useNavigate();

  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const idempotencyKey = useRef(crypto.randomUUID());

  function validateAccountStep(): boolean {
    setError(null);

    if (!values.email.trim()) {
      setError("Enter your email address.");
      return false;
    }

    if (values.password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return false;
    }

    if (values.password !== values.confirmPassword) {
      setError("The passwords do not match.");
      return false;
    }

    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!validateAccountStep()) {
      return;
    }

    if (values.tribeId === null) {
      setError("Choose a tribe before continuing.");
      return;
    }

    setIsSubmitting(true);

    const email = values.email.trim();

    try {
      await register(
        {
          email,
          password: values.password,
          tribeId: values.tribeId,
        },
        idempotencyKey.current,
      );

      await login({
        email,
        password: values.password,
      });

      navigate("/app", { replace: true });
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Unable to create your account."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<K extends keyof RegisterFormValues>(
    field: K,
    value: RegisterFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    idempotencyKey.current = crypto.randomUUID();
  }

  return {
    values,
    error,
    isSubmitting,
    validateAccountStep,
    handleSubmit,
    updateField,
  };
}
