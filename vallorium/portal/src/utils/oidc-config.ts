import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { AuthProviderProps } from 'src/contexts/auth';

/**
 * The auth provider in this template uses `oidc-client-ts` as
 * a connector to your OpenID Connect provider (Keycloak)
 *
 * The following props will be documented as if you were connecting a
 * Keycloak instance to the app, but any other OIDC provider should also work.
 *
 * TODO : Answer on whether to include react-oidc-context as a dep.
 * TODO : create user menu with profile info (fullname, email, logout, etc...)
 */
export const oidcConfig: AuthProviderProps = {
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },

  userManager: new UserManager({
    authority: `${import.meta.env.VITE_KEYCLOAK_HOST}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}`,
    client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
    metadataUrl: `${import.meta.env.VITE_KEYCLOAK_HOST}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}/.well-known/openid-configuration`,

    /**
     * When using "Client Authentication", find the corresponding secret in the "Credentials" tab.
     *
     * This type of authentication is made for machine-to-machine communications using service-roles.
     * Use only if you are certain not to expose this value. (ex: frontend host is not public)
     * (frontend env-variables and source-files are exposed to whoever loads the page in a browser)
     */
    client_secret: undefined,

    /**
     * TODO: document this. Why sessionStorage ? Why not localStorage ? Why not cookies (using 'cookie-storage')
     *
     * If using cookies, will they be scoped to the domain of my choice ? Can they be scoped for my API or other services ?
     * If scoped like this, are they correctly and automatically sent when using axios ? What will the API or service make
     * of these cookies ?
     *
     * @see https://github.com/authts/oidc-client-ts/issues/759#issuecomment-1307440513
     */
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),

    /**
     * Override this value when calling `signinRedirect` to
     * prevent router from performing navigations to various indexes,
     * thus removing state and hash from url.
     */
    redirect_uri: window.location.origin,

    /**
     * URI user is presented to after beign logged-out.
     *
     * If the corresponding route is protected (using AuthGuard), user
     * will immediately be redirected to login page and won't see the page.
     *
     * If you use public routes and want your user to see those after being disconnected,
     * be sure to set one of them here :
     * @example:
     * `${window.location.origin}${paths.public.home}`
     */
    post_logout_redirect_uri: window.location.origin,

    /**
     * Enables cross tab login/logout detection
     * If you encounter performance issues, change detection interval using `checkSessionIntervalInSeconds`
     */
    monitorSession: true,

    /**
     * Automatically renew access token.
     *
     * When recieving token, a timer is started which will fire
     * a callback to renew the token in the background before it expires.
     *
     * To ensure renewal is successful, the trigger happens some time before expiration time.
     * This delay can be changed using `accessTokenExpiringNotificationTimeInSeconds` (default : 60 seconds)
     */
    automaticSilentRenew: true,

    /**
     * How long before token expiration should the auto-renewal happen.
     *
     * Default is 60 seconds - auto-refresh will happen 60 seconds before access token expires.
     *
     * Keycloak default expiration is 60 seconds. This means refresh would happen every second (not ideal)
     * When using Keycloak, be sure to have this value set (strictly) lower than the access-token expiration.
     * @see https://github.com/authts/oidc-client-ts/issues/1542
     */
    accessTokenExpiringNotificationTimeInSeconds: 15, // with keycloak, renewal happens every 60 - 15 = 45 seconds
  }),
};
