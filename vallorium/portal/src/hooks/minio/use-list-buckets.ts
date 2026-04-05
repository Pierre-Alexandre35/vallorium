import { useCallback } from 'react';
import { useGetMinioS3Client } from './use-get-minio-S3-client';
import { ListBucketsCommand } from '@aws-sdk/client-s3'; // ES Modules import

export const useListBuckets = () => {
  const getS3Client = useGetMinioS3Client();

  const listBuckets = useCallback(async () => {
    const { s3Client } = await getS3Client();

    const command = new ListBucketsCommand({});

    const res = await s3Client.send(command);

    s3Client.destroy();

    return res;
  }, [getS3Client]);

  return listBuckets;
};
