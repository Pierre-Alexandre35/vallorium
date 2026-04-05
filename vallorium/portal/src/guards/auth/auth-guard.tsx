import { QtmAlert } from '@qtm/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SplashScreen } from 'src/components/loading';
import { Typography } from 'src/components/typography';
import { hasAuthParams } from 'src/contexts';
import { useLogger } from 'src/hooks';
import { useAuth } from 'src/hooks/auth';

/**
 * Wrapper for components you want to protect behind authentication.
 *
 * Will redirect to your auth-provider signIn portal if user is not logged-in,
 * and back to the URL you were after authentication succeeds.
 *
 * Use this in routes :
 * @example
 * const route: RouteObject[] = [
 *   {
 *     path: '/home',
 *     element: <Outlet />,
 *     children: [
 *       {
 *         element: (
 *           <AuthGuard>
 *             <ProtectedPage />
 *           </AuthGuard>
 *         ),
 *         path: '/protected',
 *       },
 *       {
 *         element: <PublicPage />,
 *         path: '/public',
 *       },
 *     ],
 *   },
 * ];
 */
export const AuthGuard: React.FC<React.PropsWithChildren> = ({ children }) => {
  const {
    isAuthenticated,
    error,
    isLoading,
    signinRedirect,
    activeNavigator,
    signoutRedirect,
    events,
  } = useAuth();

  const logger = useLogger({ scope: 'auth-guard', mode: 'dev' });

  const [hasTriedSignin, setHasTriedSignin] = useState(false);

  /**
   * Do auto sign in.
   *
   * See {@link https://github.com/authts/react-oidc-context/tree/a779b2e0162738589f3bbadb6f764642a33d7241?tab=readme-ov-file#automatic-sign-in}
   */
  useEffect(() => {
    if (
      !(
        hasAuthParams({ location }) ||
        isAuthenticated ||
        activeNavigator ||
        isLoading ||
        hasTriedSignin
      )
    ) {
      void signinRedirect({
        /**
         * Redirect to the page the signin was called.
         *
         * This prevents our router from having to perform navigation on
         * routes the default `redirect_uri` might be configured with (from the config),
         * thus removing search and hash params on them.
         *
         * Search and hash params from the current location will be read by `hasAuthParams()` to
         * decide whether authentication has succeeded.
         */
        redirect_uri: `${window.location.origin}${window.location.pathname}`,
      });
      setHasTriedSignin(true);
    }
  }, [
    activeNavigator,
    hasTriedSignin,
    isAuthenticated,
    isLoading,
    signinRedirect,
    events,
  ]);

  /**
   * Sign-out user when refresh fails.
   */
  useEffect(() => {
    // the `return` is important - addSilentRenewError() returns a cleanup function
    return events.addSilentRenewError((_) => {
      signoutRedirect();
    });
  }, [events, signoutRedirect]);

  if (activeNavigator) {
    return (
      <SplashScreen subtitle={`Authenticating with ${activeNavigator}...`} />
    );
  }

  if (error) {
    logger.log('An error occured');
    logger.error(error);
    return (
      <>
        <SplashScreen subtitle="An error occured during authentication...">
          {location.hostname.includes('local') ? (
            <QtmAlert
              severity="informative"
              dismissible={false}
              className="mb-l w-8/12"
            >
              <Typography>
                Vous semblez utiliser le HUMS en local. Si vous n&apos;avez pas
                configuré de certificat TLS, assurez-vous de visiter{' '}
                <Link
                  className="underline text-primary-500"
                  to="https://dit-keycloakx.cluster.local/auth"
                  target="_blank"
                >
                  dit-keycloakx.cluster.local/auth
                </Link>{' '}
                avec votre navigateur au moins une fois avant de pouvoir vous
                connecter.
              </Typography>
            </QtmAlert>
          ) : null}
        </SplashScreen>
      </>
    );
  }

  if (isLoading) {
    return <SplashScreen subtitle="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <SplashScreen subtitle="Start authenticating..." />;
  }

  return children;
};
