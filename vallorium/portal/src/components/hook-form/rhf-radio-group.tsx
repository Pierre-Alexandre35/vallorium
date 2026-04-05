import { useFormContext, Controller } from 'react-hook-form';
import { memo } from 'react';
import clsx from 'clsx';
import { Typography } from '../typography';
import { RadioInput } from '../inputs';

interface Props<Opt extends { id: string; label: string }> {
  name: string;
  options: Opt[];
  helperText?: string;
}

function RHFRadioGroupBeforeMemo<Opt extends { id: string; label: string }>({
  name,
  options,
  helperText,
}: Props<Opt>) {
  const { control, setValue } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <>
          <div className="flex gap-l">
            {options.map((opt) => (
              <RadioInput
                key={opt.id}
                name={`location.${opt.id}`}
                value={opt.id}
                label={opt.label}
                checked={field?.value?.id === opt.id}
                onChange={(e) => {
                  const newVal = options.find((o) => o.id === e.target.value);
                  if (newVal) {
                    setValue(name, newVal);
                  }
                }}
              />
            ))}
          </div>
          {(!!error || helperText) && (
            <Typography
              component="caption-1"
              className={clsx(error ? 'text-danger-default' : '', 'px-m')}
            >
              {error ? error?.message : helperText}
            </Typography>
          )}
        </>
      )}
    />
  );
}

export const RHFRadioGroup = memo(
  RHFRadioGroupBeforeMemo,
) as typeof RHFRadioGroupBeforeMemo;
