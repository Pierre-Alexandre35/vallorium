import { useLogger } from '../utils';
import { User } from 'oidc-client-ts';
import { useAuth } from './use-auth';

export const useUser = ():
  | { loading: true; user?: undefined }
  | { loading?: false | undefined; user: User } => {
  const { user, isLoading } = useAuth();
  const logger = useLogger({ scope: 'use-user', mode: 'always' });

  if (isLoading || !user?.access_token) {
    return { loading: true };
  }

  if (!user || !user.access_token) {
    logger.warn(
      'User is not defined, make sure this component is wrapped around a AuthGuard and your user is authenticated.',
    );
  }

  return { user: user as User };
};
