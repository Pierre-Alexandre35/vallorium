import { useCallback } from 'react';
import { axios } from 'src/utils';
import { useUser } from '../auth';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { useLogger } from '../utils';

type AssumeRoleWithWebIdentityResponse = {
  AssumeRoleWithWebIdentityResult: {
    AssumedRoleUser: {
      /**
       * Should be empty
       *
       * @example
       * ''
       */
      Arn: string;
      /**
       * Should be empty
       *
       * @example
       * ''
       */
      AssumeRoleId: string;
    };
    Credentials: {
      /**
       * Temporary access key ID
       *
       * @example
       * 'Q209ZT9AH80FVR2HT6UF'
       */
      AccessKeyId: string;
      /**
       * Temporary secret access key
       *
       * @example
       * 'RZdqstaGz9ZpuHF7S7wu06QlePRyg3vlxYfdiIaf'
       */
      SecretAccessKey: string;
      /**
       * Temporary session JWT token
       *
       * @example
       * 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...'
       */
      SessionToken: string;
      /**
       * Canonical expiration date of these credentials
       *
       * @example
       * '2024-09-24T16:34:22Z'
       */
      Expiration: string;
    };
    /**
     * @example
     * '62f64ec0-7ee8-4ebf-bb28-3cd157a12955'
     */
    SubjectFromWebIdentityToken: string;
  };
  ResponseMetadata: {
    /**
     * @example
     * '17F83852A8ADDDFE'
     */
    RequestId: string;
  };
};

export const useGetMinioCredentials = () => {
  const { user } = useUser();
  const logger = useLogger({ scope: 'MinioCreds' });

  const getCredentials = useCallback(async () => {
    const fetchError = new Error('Could not fetch temporary MinIO credentials');

    try {
      /**
       * Get temporary credentials with AssumeRoleWithWebIdentity
       *
       * @see https://min.io/docs/minio/linux/operations/external-iam/configure-openid-external-identity-management.html#generate-s3-compatible-temporary-credentials-using-oidc-credentials
       * @see https://min.io/docs/minio/linux/developers/security-token-service/AssumeRoleWithWebIdentity.html#minio-sts-assumerolewithwebidentity
       */
      const tempCredentials = await axios.post<string>(
        import.meta.env.VITE_MINIO_HOST,
        undefined,
        {
          params: {
            Action: 'AssumeRoleWithWebIdentity',
            WebIdentityToken: user?.id_token,
            Version: '2011-06-15',
            DurationSeconds: '86400',
          },
          transformRequest: (d: undefined, headers) => {
            delete headers.Authorization;
            return d;
          },
        },
      );

      if (!tempCredentials?.data) {
        throw fetchError;
      }

      /**
       * Validate and parse XML response
       */
      const validationRes = XMLValidator.validate(tempCredentials.data);
      if (validationRes !== true) {
        throw validationRes;
      }
      const parsedTempCredentials: {
        AssumeRoleWithWebIdentityResponse: AssumeRoleWithWebIdentityResponse;
      } = new XMLParser().parse(tempCredentials.data);

      return {
        credentials:
          parsedTempCredentials.AssumeRoleWithWebIdentityResponse
            .AssumeRoleWithWebIdentityResult.Credentials,
        rawResponse: parsedTempCredentials.AssumeRoleWithWebIdentityResponse,
      };
    } catch (error) {
      logger.error(error);
      throw fetchError;
    }
  }, [logger, user?.id_token]);

  return getCredentials;
};
