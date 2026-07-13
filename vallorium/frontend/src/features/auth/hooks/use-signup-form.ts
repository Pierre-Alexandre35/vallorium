import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { login } from "@/features/auth/api/login";
import { register } from "@/features/auth/api/register";
import type { RegisterFormValues } from "@/features/auth/types/auth";
import { storage } from "@/lib/storage";

const INITIAL_VALUES: RegisterFormValues = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function useSignupForm() {
  const navigate = useNavigate();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (values.password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    if (values.password !== values.confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register(values);
      const response = await login({ email: values.email, password: values.password });
      storage.setAccessToken(response.access_token);
      navigate("/app", { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail ?? "Unable to create your account.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<K extends keyof RegisterFormValues>(
    field: K,
    value: RegisterFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  return { values, error, isSubmitting, handleSubmit, updateField };
}
