import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { login } from "@/features/auth/api/login";
import type { LoginFormValues } from "@/features/auth/types/auth";

const INITIAL_VALUES: LoginFormValues = {
  email: "",
  password: "",
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

export function useLoginForm() {
  const navigate = useNavigate();

  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);

  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      await login(values);

      navigate("/app", {
        replace: true,
      });
    } catch (error) {
      setError(getErrorMessage(error, "Unable to sign in."));
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<K extends keyof LoginFormValues>(
    field: K,
    value: LoginFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return {
    values,
    error,
    isSubmitting,
    handleSubmit,
    updateField,
  };
}
