import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { login } from '@/features/auth/api/login';
import type { LoginFormValues } from '@/features/auth/types/auth';
import { storage } from '@/lib/storage';

const INITIAL_VALUES: LoginFormValues = {
  email: '',
  password: '',
};

export function useLoginForm() {
  const navigate = useNavigate();
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await login(values);
      storage.setAccessToken(response.access_token);
      navigate('/app', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail ?? 'Unable to sign in.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<K extends keyof LoginFormValues>(field: K, value: LoginFormValues[K]) {
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
