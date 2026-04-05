import {
  QtmAlert,
  QtmButton,
  QtmModal,
  QtmModalBody,
  QtmModalFooter,
  QtmModalHeader,
  QtmModalTitle,
  QtmProgressBar,
} from '@qtm/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLogger, useUploadFile } from 'src/hooks';
import { ComponentProps } from 'src/types';
import { SystemLocation } from 'src/types/systems';
import { FormProvider, RHFRadioGroup, RHFUpload } from '../hook-form';
import { useForm } from 'react-hook-form';
import { Typography } from '../typography';
import { enqueueSnackbar } from 'notistack';
import { dataUploadFormSchema } from './data-upload.form-schema';
import { Button } from '../button';
import { Link } from 'react-router-dom';

type P = {
  systemId: string;
  closeModal: () => void;
  locationOptions: SystemLocation[];
} & ComponentProps<typeof QtmModal>;

export const DataUploadModal = ({
  systemId,
  closeModal,
  locationOptions,
  ...modalProps
}: P) => {
  const logger = useLogger({ scope: 'DataUpload', mode: 'dev' });

  const { progress, uploadFile } = useUploadFile({
    onUploaded: (file) => {
      setTimeout(() => closeModal(), 1000);
      setTimeout(
        () =>
          enqueueSnackbar({
            variant: 'success',
            message: `Fichier "${file.name}" mis en ligne.`,
          }),
        700,
      );
    },
    onUploadFailed: (err) => {
      enqueueSnackbar(err.message || "Une erreur s'est produite", {
        variant: 'error',
      });
    },
  });

  const methods = useForm<{
    file: File;
    location: SystemLocation;
    pnSn: string;
  }>({
    resolver: zodResolver(dataUploadFormSchema),
    defaultValues: { file: undefined, location: undefined, pnSn: undefined },
  });

  const {
    handleSubmit,
    resetField,
    formState: { isSubmitting },
    watch,
  } = methods;

  const selectedLocation = watch('location');

  const allPnsnOptions = locationOptions.reduce(
    (acc, loc) => {
      acc[loc.id] = loc.psnsn;
      return acc;
    },
    {} as Record<string, string[]>,
  );

  const onSubmit = handleSubmit(async (data) => {
    try {
      await uploadFile(data.file, {
        fileFolder: `upload/${data.location.id}`,
        bucket: import.meta.env.VITE_MINIO_BUCKET,
      });
    } catch (err) {
      logger.error(err);
      enqueueSnackbar("Une erreur s'est produite", { variant: 'error' });
    }
  });

  return (
    <QtmModal
      {...modalProps}
      onCloseModal={(e) => {
        closeModal();
        if (modalProps.onCloseModal) {
          modalProps.onCloseModal(e);
        }
      }}
    >
      <QtmModalHeader closeIcon>
        <QtmModalTitle>Déposer un fichier pour : {systemId}</QtmModalTitle>
      </QtmModalHeader>
      <QtmModalBody>
        {location.hostname.includes('local') ? (
          <QtmAlert severity="informative" dismissible={false} className="mb-l">
            <Typography>
              Vous semblez utiliser le HUMS en local. Si vous n&apos;avez pas
              configuré de certificat TLS, assurez-vous de visiter{' '}
              <Link
                className="underline text-primary-500"
                to="https://dit-minio-api.cluster.local/"
                target="_blank"
              >
                dit-minio-api.cluster.local
              </Link>{' '}
              avec votre navigateur au moins une fois avant de faire un upload.
            </Typography>
          </QtmAlert>
        ) : null}
        <FormProvider methods={methods} id="upload-data-form">
          <RHFUpload
            accept={{ 'application/zip': ['.zip'] }}
            maxFiles={1}
            name="file"
            uploadHelperText="Archive ZIP uniquement"
            onRemove={() => resetField('file')}
            className="w-full"
          />
          <div className="mt-l">
            <Typography component="subtitle-2">Sélection du site:</Typography>
            <RHFRadioGroup name="location" options={locationOptions} />
          </div>

          {selectedLocation && (
            <div className="mt-l">
              <Typography component="subtitle-2">Sélection du PNSN:</Typography>
              <RHFRadioGroup
                name="pnSn"
                options={(allPnsnOptions[selectedLocation.id] || []).map(
                  (pnsn) => ({
                    id: pnsn,
                    label: pnsn,
                  }),
                )}
              />
            </div>
          )}
        </FormProvider>

        {progress ? (
          <div className="flex items-center mt-l">
            <div className="w-full mr-xs">
              <QtmProgressBar
                showValue={false}
                value={progress}
                variant="determinate"
                color="primary"
              />
            </div>
            <div style={{ minWidth: 35 }}>
              <Typography
                component="body-1"
                className="font-medium text-bluegrey-400"
              >
                {`${Math.round(progress)}%`}
              </Typography>
            </div>
          </div>
        ) : null}
      </QtmModalBody>
      <QtmModalFooter classes="justify-end gap-m">
        <QtmButton variant="ghost" color="primary" onClick={closeModal}>
          Close
        </QtmButton>
        <Button
          variant="filled"
          color="primary"
          type="button"
          role="form"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          Upload
        </Button>
      </QtmModalFooter>
    </QtmModal>
  );
};
