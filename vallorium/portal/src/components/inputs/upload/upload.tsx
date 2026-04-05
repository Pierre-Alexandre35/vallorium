import { useDropzone } from 'react-dropzone';
import { UploadProps } from './types';
import { useEffect, useState } from 'react';
import { isEmpty } from 'lodash';
import { FileThumbnail, fileSize } from '../../file-thumbnail';
import { QtmIcon, QtmProgressBar } from '@qtm/react';
import { Typography } from '../../typography';
import clsx from 'clsx';
import { Button } from '../../button';
import { useUploadFile } from 'src/hooks';

export default function Upload({
  uploadPresignUrl,
  fileFolder,
  bucket,
  disabled,
  error,
  helperText,
  uploadHelperText,
  label,
  uploadOnSelect,
  //
  file,
  onSelected,
  onDelete,
  onUploaded,
  onUploadFailed,
  //
  files,
  onRemove,
  onRemoveAll,
  className,
  ...other
}: UploadProps) {
  const [localFiles, setLocalFiles] = useState<(File | null)[]>(
    files?.length ? files : [(isEmpty(file) ? null : file) || null],
  );

  const { progress, uploadFile } = useUploadFile({
    onUploaded: (file) => {
      setLocalFiles([file]);
      if (onUploaded) onUploaded(file);
    },
    onUploadFailed,
  });

  // Update localFiles
  useEffect(() => {
    setLocalFiles(
      files?.length ? files : [(isEmpty(file) ? null : file) || null],
    );
  }, [files, file]);

  const hasFiles = !!localFiles.filter((f) => !!f).length;

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      disabled: hasFiles,
      noClick: hasFiles,
      noKeyboard: hasFiles,
      multiple: false,
      async onDrop(acceptedFiles: File[], fileRejections, __) {
        if (fileRejections && fileRejections.length) {
          if (onUploadFailed) {
            onUploadFailed(
              new Error(
                fileRejections.find(
                  (fr) => !!fr.errors.length,
                )?.errors[0].message,
              ),
            );
          }
          return;
        }

        if (acceptedFiles === null || acceptedFiles.length < 1) {
          if (onUploadFailed)
            onUploadFailed(new Error('Aucun fichier valide à mettre en ligne'));
          return;
        }

        const acceptedFile = acceptedFiles[0];

        if (!acceptedFile.name || !acceptedFile.type) {
          if (onUploadFailed) onUploadFailed(new Error('Fichier malformé'));
          return;
        }

        setLocalFiles([acceptedFile]);

        if (onSelected) onSelected(acceptedFile);

        if (uploadOnSelect) {
          if (!uploadPresignUrl || !bucket) {
            if (onUploadFailed)
              onUploadFailed(new Error("Bucket d'upload manquant"));
            return;
          } else {
            await uploadFile(acceptedFile, { fileFolder, bucket });
          }
        }
      },
      ...other,
    });

  const renderPlaceholder = (
    <>
      <QtmIcon icon="upload" size="large" />
      <div className="text-center gap-xs flex flex-col">
        <Typography
          component="body-2"
          className={clsx(
            disabled || isDragReject ? 'text-black-30' : 'text-black-40',
          )}
        >
          <Typography
            component="body-2"
            className={clsx(
              disabled || isDragReject ? 'text-black-60' : 'text-black-70',
            )}
          >
            Sélectionnez un fichier
          </Typography>
          ou faites glisser.
        </Typography>
        {uploadHelperText && (
          <Typography
            component="caption-1"
            className={clsx(
              disabled || isDragReject ? 'text-black-60' : 'text-black-70',
              'text-center',
            )}
          >
            {uploadHelperText}
          </Typography>
        )}
      </div>
    </>
  );

  const [previewButtonType, setPreviewButtonType] = useState<
    'delete' | 'success'
  >('delete');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (progress === 100) {
      setPreviewButtonType('success');
      timeoutId = setTimeout(() => setPreviewButtonType('delete'), 1000);
    }
    return () => clearTimeout(timeoutId);
  }, [progress]);

  const renderPreview = hasFiles && (
    <>
      {localFiles?.map((file) => {
        if (!file) return;

        return (
          <div className="flex w-full gap-s" key={file.toString()}>
            <FileThumbnail file={file} />

            <div className="min-w-none flex-1">
              <div className="flex justify-between gap-s">
                <Typography
                  component="body-2"
                  className="text-ellipsis overflow-hidden whitespace-nowrap"
                >
                  {file.name}
                </Typography>
                {previewButtonType === 'success' ? (
                  <div
                    className="flex justify-center items-center"
                    style={{
                      width: 32,
                      height: 32,
                      minWidth: 32,
                      minHeight: 32,
                    }}
                  >
                    <QtmIcon icon="check_circle" />
                  </div>
                ) : (
                  <Button
                    size="small"
                    variant="ghost"
                    onClick={
                      onRemove
                        ? (f) => {
                            onRemove(f);
                            setLocalFiles([null]);
                          }
                        : undefined
                    }
                  >
                    <QtmIcon icon="delete" className="text-black-50" />
                  </Button>
                )}
              </div>
              {!!file.size && (
                <Typography component="body-2" className="text-black-50">
                  {fileSize(file.size)}
                </Typography>
              )}
              {progress !== null ? (
                <div className="flex items-center">
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
                    >{`${Math.round(progress)}%`}</Typography>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );

  return (
    <div className={clsx('relative', className)} style={{ minWidth: 0 }}>
      {label && (
        <Typography component="body-2" className="mb-3xs">
          {label}
        </Typography>
      )}
      <div
        {...getRootProps()}
        style={{
          minWidth: 0,
        }}
        className={clsx(
          'py-s px-l rounded-large outline-none overflow-hidden relative',
          !isDragReject && !disabled
            ? 'bg-bluegrey-25 hover:bg-bluegrey-50'
            : '',
          isDragReject || disabled ? 'bg-black-10' : '',
          isDragActive && !isDragReject
            ? 'outline outline-1 outline-primary-default'
            : '',
          error ? 'outline outline-1 outline-danger-default-default' : '',
          hasFiles || disabled ? 'cursor-default' : 'cursor-pointer',
        )}
      >
        <input {...getInputProps()} />

        <div
          className={clsx(
            'gap-xs items-center justify-center flex-wrap flex flex-col',
            disabled || isDragReject ? 'text-black-40' : undefined,
          )}
        >
          {hasFiles ? renderPreview : renderPlaceholder}
        </div>
      </div>

      {helperText ? helperText : undefined}
    </div>
  );
}
