import React from 'react';
import { AuthContext, type AuthContextProps } from 'src/contexts/auth';
import { useLogger } from '../utils';

/**
 * @public
 */
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  const logger = useLogger({ scope: 'use-auth', mode: 'prod' });

  if (!context) {
    logger.warn(
      'AuthProvider context is undefined, please check you are calling useAuth() as child of a <AuthProvider> component.',
    );
  }

  return context as AuthContextProps;
};
