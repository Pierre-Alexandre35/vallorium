import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { SplashScreen } from 'src/components/loading';
import { useLogger, useRoles } from 'src/hooks';
import { KeycloakClaimResources } from 'src/types';

type AllOfRoles = {
  /**
   * Roles required for this wrapper to render it's children
   */
  allOf: string[];
};
type OneOfRoles = {
  /**
   * Roles required for this wrapper to render it's children
   */
  oneOf: string[];
};

export type RoleGuardProps = (AllOfRoles | OneOfRoles) &
  (
    | {
        /**
         * Whether to compare required roles against realm_access or resource_access roles.
         */
        mode: 'resource';
        resource: KeycloakClaimResources;
      }
    | {
        /**
         * Whether to compare required roles against realm_access or resource_access roles.
         */
        mode: 'realm';
      }
    | {
        /**
         * Whether to compare required roles against realm_access or resource_access roles.
         */
        mode: undefined;
      }
  );

const isAllOf = (p: unknown): p is AllOfRoles => !!(p as AllOfRoles).allOf;

/**
 * Wrapper for components you want to protect behind role claims from keycloak.
 */
export const RoleGuard: React.FC<React.PropsWithChildren<RoleGuardProps>> = ({
  children,
  ...props
}) => {
  const { loading, roles } = useRoles();
  const logger = useLogger({ scope: 'role-guard', mode: 'dev' });

  const requiredRoles = useMemo(
    () => (isAllOf(props) ? props.allOf : props.oneOf),
    [props],
  );

  const matchedRoles = useMemo(
    () =>
      requiredRoles.map((requiredRole) => {
        if (props.mode === 'resource') {
          return roles?.resource_access[props.resource].roles.includes(
            requiredRole,
          );
        } else {
          return roles?.realm_access.roles.includes(requiredRole);
        }
      }),
    [requiredRoles, roles, props],
  );

  const shouldRender = useMemo(() => {
    if (isAllOf(props)) {
      return matchedRoles.reduce((ra, rb) => ra && rb, true);
    } else {
      return matchedRoles.reduce((ra, rb) => ra || rb, false);
    }
  }, [matchedRoles, props]);

  if (loading) {
    return <SplashScreen subtitle="Loading roles..." />;
  } else if (shouldRender) {
    return children;
  } else {
    logger.warn('Roles do not match, cannot render');
    return <Navigate to={'/403'} />;
  }
};
