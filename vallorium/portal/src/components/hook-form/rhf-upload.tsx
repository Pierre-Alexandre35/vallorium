import { useFormContext, Controller } from 'react-hook-form';
import { Upload, UploadProps } from '../inputs/upload';
import { enqueueSnackbar } from '../snackbar';
import { memo } from 'react';
import clsx from 'clsx';
import { Typography } from '../typography';

interface Props extends Omit<UploadProps, 'file'> {
  name: string;
}

function RHFUploadBeforeMemo({ name, helperText, ...other }: Props) {
  const { control, setValue, setError, clearErrors } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Upload
          file={field.value}
          error={!!error}
          helperText={
            (!!error || helperText) && (
              <Typography
                component="caption-1"
                className={clsx(error ? 'text-danger-default' : '', 'px-m')}
              >
                {error ? error?.message : helperText}
              </Typography>
            )
          }
          {...other}
          onUploaded={(customFile) => {
            setValue(name, customFile);
            enqueueSnackbar('Fichier mis-en-ligne', { variant: 'success' });
            if (other.onUploaded) other.onUploaded(customFile);
          }}
          onUploadFailed={(err) => {
            setError(name, {
              message: err?.message || err?.toString(),
              type: 'value',
            });
            enqueueSnackbar("Une erreur s'est produite", { variant: 'error' });
            if (other.onUploadFailed) other.onUploadFailed(err);
          }}
          onSelected={(file) => {
            if (!other?.uploadOnSelect) {
              setValue(name, file);
            }
            clearErrors(name);
            if (other.onSelected) other.onSelected(file);
          }}
        />
      )}
    />
  );
}

export const RHFUpload = memo(
  RHFUploadBeforeMemo,
) as typeof RHFUploadBeforeMemo;
