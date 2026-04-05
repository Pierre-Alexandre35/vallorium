import { useCallback } from 'react';
import { useGetMinioCredentials } from './use-get-minio-credentials';
import { useLogger } from '../utils';
import { S3Client } from '@aws-sdk/client-s3';

export const useGetMinioS3Client = () => {
  const getCredentials = useGetMinioCredentials();
  const logger = useLogger({ scope: 'S3Client' });

  const getS3Client = useCallback(async () => {
    const { credentials } = await getCredentials();

    const s3Client = new S3Client({
      region: 'eu-west-3', // useless, only satisfies client-side library checks
      endpoint: import.meta.env.VITE_MINIO_HOST,
      forcePathStyle: true, // do not use S3 path styles (https://[bucket].[hostname].[region].s3-aws.com/object/path)
      credentials: {
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken,
      },
      logger,
    });

    if (!s3Client) {
      throw new Error('Could not instanciate S3 Client');
    }

    return {
      s3Client,

      /**
       * Expiration date of the credentials
       */
      expiration: new Date(credentials.Expiration),
    };
  }, [getCredentials, logger]);

  return getS3Client;
};
