import { InputHTMLAttributes, useMemo } from 'react';
import { Typography } from '../typography';

type P = InputHTMLAttributes<HTMLInputElement> & { label?: string };

export const RadioInput = ({ label, ...inputProps }: P) => {
  const randId = useMemo(
    () => (Math.random() + 1).toString(36).substring(7),
    [],
  );
  return (
    <div className="flex items-center mb-4 gap-xs">
      <input
        id={randId}
        type="radio"
        className="w-m h-m text-primary-600 bg-black-100 border-black-300"
        {...inputProps}
      />
      <label htmlFor={randId}>
        <Typography component="body-1" className="text-black-70">
          {label}
        </Typography>
      </label>
    </div>
  );
};
