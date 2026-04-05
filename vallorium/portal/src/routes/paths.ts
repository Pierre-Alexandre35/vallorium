const ROOTS = {
  USER: '/user',
  AUTH: '/auth',
  SYSTEMS: '/systems',
  INVENTORY: '/inventory',
  ADMIN: '/admin',
} as const;

/**
 * Stores valid (not necessarily implemented) router paths.
 *
 * A `path` object may contain none or many other `path`s, or be
 * a string (if it has no children)
 *
 * ```typescript
 * type Path = {
 *  root: string;
 *  [string]: Path;
 * } | string;
 *
 * type Paths = Record<string, Path>;
 * ```
 */
export const paths = {
  auth: {
    root: ROOTS.AUTH,
    login: `${ROOTS.AUTH}/login`,
    verify: `${ROOTS.AUTH}/verify`,
  },

  user: {
    root: `${ROOTS.USER}`,
    profile: `${ROOTS.USER}/profile`,
  },

  inventory: {
    root: ROOTS.INVENTORY,
  },

  systems: {
    root: ROOTS.SYSTEMS,
    system: `${ROOTS.SYSTEMS}/:systemId`,
  },

  admin: {
    root: ROOTS.ADMIN,
    whitelist: `${ROOTS.ADMIN}/whitelist`,
    users: `${ROOTS.ADMIN}/users`,
  },
} as const;

/**
 * Remove trailing slash and split by slashes, then pick the last occurrence
 * @example getPathName('/auth/jwt') -> 'jwt'
 */
export const getPathEnd = (path: string) =>
  path.replace(/\/$/, '').split('/').pop();

/**
 * Get last portion of the path, given a length N
 * @example getLastNPaths('/auth/jwt/login', 2) -> 'jwt/login'
 */
export const getLastNPaths = (path: string, N: number) =>
  path.split('/').slice(-N).join('/');
