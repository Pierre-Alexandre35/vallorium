import { MODE } from './mode.enum';

export type OwnEnv = {
  VITE_VERSION: string;
  VITE_API_URL: string;
  VITE_STRIPE_PUBLIC_KEY: string;
  /**
   * Non "VITE_"-prefixed variables won't be available at run-time,
   * but can be read before build (in vite.config.ts).
   *
   * @see https://vitejs.dev/config/#using-environment-variables-in-config
   */
  SECRET_NOT_EXPOSED?: string | undefined;
  SERVER_PORT?: string | undefined;

  VITE_KEYCLOAK_HOST: string;
  VITE_KEYCLOAK_REALM: string;
  VITE_KEYCLOAK_CLIENT_ID: string;

  VITE_MINIO_HOST: string;
  VITE_MINIO_BUCKET: string;
};

export type AppEnv = OwnEnv & {
  /**
   * Vite's mode set automatically or with the "--mode" flag.
   * @see https://vitejs.dev/guide/env-and-mode#modes
   */
  MODE: MODE;

  /**
   * Reflects whether NODE_ENV was set to "production"
   *
   * NODE_ENV is typically set by vite at build-time :
   *
   * - `vite build` will set NODE_ENV to "production"
   * - `vite` or `vite dev` will set NODE_ENV to "development"
   *
   * NODE_ENV can also be set manually to any value using an env-file or a command,
   * but we advise against it and recommend using MODES.
   *
   * > NODE_ENV is a different concept from MODE and needs to be handled with care as it
   * > can break some dependency behaviors. By convention (in the node ecosystem),
   * > stick NODE_ENV to "production" or "development".
   *
   * @see https://vitejs.dev/guide/env-and-mode#node-env-and-modes
   */
  PROD: boolean;
  /**
   * always !import.meta.env.PROD
   */
  DEV: boolean;
};
