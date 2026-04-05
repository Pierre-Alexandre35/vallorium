import { DropzoneOptions } from 'react-dropzone';

export interface UploadProps
  extends Omit<DropzoneOptions, 'multiple' | 'onDrop'> {
  uploadPresignUrl?: string;

  /**
   * Folder within bucket to place the file to.
   *
   * Do not include final "/"
   */
  fileFolder?: string;
  /**
   * MinIO Bucket name
   *
   * @example
   *
   * 'dit'
   */
  bucket?: string;
  error?: boolean;
  placeholder?: React.ReactNode;
  label?: string;
  uploadHelperText?: string;
  helperText?: React.ReactNode;
  uploadOnSelect?: boolean;
  //
  file?: File | null;
  onSelected?: (file: Partial<File>) => void;
  onDelete?: VoidFunction;
  onUploaded?: (file: Partial<File>) => void;
  onUploadFailed?: (error: Error) => void;
  //
  files?: (File | null)[];
  onRemove?: (file: Partial<File> | string) => void;
  onRemoveAll?: VoidFunction;
  className: string;
}
