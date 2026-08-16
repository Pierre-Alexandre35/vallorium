import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { login } from "@/features/auth/api/login";
import { cacheCurrentUser } from "@/features/auth/auth-query";
import type { LoginFormValues } from "@/features/auth/types/auth";
import { getRequestErrorMessage } from "@/features/auth/utils/get-request-error-message";

const INITIAL_VALUES: LoginFormValues = {
  email: "",
  password: "",
};

interface LoginLocationState {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };
}

function getPostLoginPath(state: LoginLocationState | null): string {
  const from = state?.from;

  if (!from?.pathname?.startsWith("/") || from.pathname.startsWith("//")) {
    return "/app";
  }

  return `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`;
}

export function useLoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);

  const loginMutation = useMutation({
    mutationFn: (formValues: LoginFormValues) =>
      login({
        email: formValues.email.trim(),
        password: formValues.password,
      }),
    onSuccess: ({ user }) => {
      cacheCurrentUser(queryClient, user);
      navigate(getPostLoginPath(location.state as LoginLocationState | null), {
        replace: true,
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.mutate(values);
  }

  function updateField<K extends keyof LoginFormValues>(
    field: K,
    value: LoginFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (loginMutation.isError) {
      loginMutation.reset();
    }
  }

  return {
    values,
    error: loginMutation.error
      ? getRequestErrorMessage(loginMutation.error, "Unable to sign in.")
      : null,
    isSubmitting: loginMutation.isPending,
    handleSubmit,
    updateField,
  };
}
