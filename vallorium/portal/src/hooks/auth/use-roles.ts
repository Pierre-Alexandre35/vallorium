import { useUser } from './use-user';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { KeycloakClaimResources } from 'src/types';
import { useLogger } from '../utils';

type Access = {
  roles: string[];
};

/**
 * Partial access token type definition for Keycloak,
 * including role-related resources.
 */
type AccessTokenPayload = {
  realm_access: Access;
  resource_access: { [R in KeycloakClaimResources]: Access };
};

/**
 * Extracts a user's roles from it's access-token.
 */
export const useRoles = ():
  | { loading: true; roles?: undefined }
  | { loading?: false | undefined; roles: AccessTokenPayload } => {
  const { user, loading } = useUser();
  const logger = useLogger({ scope: 'use-roles', mode: 'hidden' });

  if (loading) {
    return { loading: true };
  }

  const claims = jwtDecode<JwtPayload & AccessTokenPayload>(user.access_token);

  logger.log(claims); // change logger-mode to show token content and see exact resource names

  return {
    roles: {
      realm_access: claims.realm_access,
      resource_access: claims.resource_access,
    },
  };
};
