import { useCallback, useState } from 'react';
import { useUser } from '../auth';
import { Upload } from '@aws-sdk/lib-storage';
import { S3Client } from '@aws-sdk/client-s3';
import { useLogger } from '../utils';
import { useGetMinioS3Client } from './use-get-minio-S3-client';
import { useListBuckets } from './use-list-buckets';

interface P {
  onUploadFailed?: (error: Error) => void;
  onUploaded?: (file: File) => void;
}

export type UploadFileParams = {
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
  bucket: string;

  /**
   * Optionnally provide an already-instanciated S3Client.
   *
   * @default undefined // Will be instanciated
   */
  s3Client?: S3Client;
};

export function useUploadFile({ onUploadFailed, onUploaded }: P) {
  const [progress, setProgress] = useState<number | null>(null);
  const { user } = useUser();
  const logger = useLogger({ scope: 'useUploadFile' });
  const getS3Client = useGetMinioS3Client();
  const listBuckets = useListBuckets();

  const uploadFile = useCallback(
    async (acceptedFile: File, params: UploadFileParams) => {
      const { fileFolder, bucket, s3Client: s3ClientParam } = params || {};
      setProgress(0);

      if (!user?.id_token) {
        if (onUploadFailed) {
          onUploadFailed(new Error('id_token not found'));
        }
        return;
      }

      /**
       * Check requested bucket exists
       */
      const listBucketResult = await listBuckets();
      const bucketList = listBucketResult.Buckets;
      if (!bucketList?.find((b) => b.Name === bucket)) {
        if (onUploadFailed) {
          onUploadFailed(new Error(`Bucket "${bucket}" not found`));
        }
        return;
      }

      /**
       * Authenticate against MinIO
       * and instanciate a S3 Client to work with.
       */
      let s3Client = s3ClientParam;
      try {
        const { s3Client: s3Client_ } = await getS3Client();

        s3Client = s3Client_;

        if (!s3Client) {
          throw new Error('Could not instanciate S3 Client');
        }
      } catch (err) {
        if (onUploadFailed) {
          onUploadFailed(err);
        }
        return;
      }

      /**
       * Perform upload
       */
      try {
        /**
         * Below, code to perform regular signle-request upload :
         * 
         * @example
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: `${fileFolder ? `${fileFolder}/` : ''}${acceptedFile.name}`,
          ContentType: acceptedFile.type,
          Body: acceptedFile,
        });

        const _ = await s3Client.send(command);
         */

        /**
         * Below, code to perform multipart upload :
         */
        const parallelUploads3 = new Upload({
          client: s3Client,
          params: {
            Bucket: bucket,
            Key: `${fileFolder ? `${fileFolder}/` : ''}${acceptedFile.name}`,
            ContentType: acceptedFile.type,
            Body: acceptedFile,
          },

          // additional optional fields show default values below:

          // (optional) concurrency configuration
          queueSize: 4,

          // (optional) size of each part, in bytes, at least 5MB
          partSize: 1024 * 1024 * 5,

          // (optional) when true, do not automatically call AbortMultipartUpload when
          // a multipart upload fails to complete. You should then manually handle
          // the leftover parts.
          leavePartsOnError: false,
        });

        parallelUploads3.on('httpUploadProgress', (progress) => {
          logger.log({ ...progress });
          if (progress.total && progress.loaded) {
            setProgress((progress.loaded * 100) / progress.total);
          }
        });

        const _ = await parallelUploads3.done();

        if (onUploaded) {
          onUploaded(acceptedFile);
        }
      } catch (err) {
        console.error(err);
        if (onUploadFailed) {
          onUploadFailed(
            err instanceof Error ? err : new Error(err?.toString()),
          );
        }
      }

      s3Client.destroy();
    },
    [
      getS3Client,
      listBuckets,
      logger,
      onUploadFailed,
      onUploaded,
      user?.id_token,
    ],
  );

  return { progress, uploadFile };
}
