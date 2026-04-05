import { SafeOmit } from 'src/types';
import { UploadProps } from './types';
import { QtmIcon } from '@qtm/react';
import { fileSize, FileThumbnail } from 'src/components/file-thumbnail';
import { Typography } from 'src/components/typography';
import { Button } from 'src/components/button';

export default function MultiFilePreview({
  files,
  onRemove,
}: SafeOmit<UploadProps, 'uploadPresignUrl' | 'files' | 'fileFolder'> & {
  files: (File | null)[];
}) {
  return (
    <>
      {files?.map((file) => {
        if (!file) return;

        return (
          <div
            className="flex flex-row items-center gap-m my-xs py-xs px-s"
            key={file.toString()}
          >
            <FileThumbnail file={file} />

            <div style={{ width: 0 }}>
              <Typography
                component="body-2"
                className="whitespace-nowrap overflow-hidden text-ellipsis text-black-40"
              >
                {file.name}
              </Typography>
              <Typography component="body-2" className="text-black-40">
                {fileSize(file.size)}
              </Typography>
            </div>

            {onRemove && (
              <Button
                size="small"
                variant="ghost"
                onClick={() => onRemove(file)}
                className="text-black-40"
              >
                <QtmIcon icon="delete" size="small" />
              </Button>
            )}
          </div>
        );
      })}
    </>
  );
}
