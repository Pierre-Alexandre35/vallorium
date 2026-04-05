/**
 * Resources your user might have roles for.
 *
 * `account` might always be present, but other resources are implementation-dependant.
 *
 * @example type DefaultResources = 'account' | 'realm-app-1' | 'realm-app-2';
 */
export type KeycloakClaimResources = 'account' | 'web-client';
