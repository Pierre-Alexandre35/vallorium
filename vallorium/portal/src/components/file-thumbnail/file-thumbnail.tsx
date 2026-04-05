import { fileFormat } from './utils';
import { QtmIcon, QtmTooltip } from '@qtm/react';

type FileIconProps = {
  file: File;
  tooltip?: boolean;
  previewUrl?: string;
};

export function FileThumbnail({ file, tooltip, previewUrl }: FileIconProps) {
  const format = fileFormat(file.name);

  const renderContent =
    format === 'image' && !previewUrl ? (
      <QtmIcon size="small" icon="image" className="text-black-40" />
    ) : format === 'image' && previewUrl ? (
      <img
        alt="file preview"
        src={previewUrl}
        style={{
          width: 32,
          height: 32,
          borderRadius: 32,
        }}
      />
    ) : (
      <QtmIcon size="small" icon="description" className="text-black-40" />
    );

  if (tooltip) {
    return (
      <QtmTooltip title={file.name}>
        <span className="flex flex-col shrink-0 items-center justify-center">
          {renderContent}
        </span>
      </QtmTooltip>
    );
  }

  return renderContent;
}
