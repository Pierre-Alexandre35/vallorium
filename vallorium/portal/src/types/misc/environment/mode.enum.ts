/**
 * The mode vite has built the app for.
 */
export enum MODE {
  /**
   * Enabled by `$ vite build`
   */
  PROD = 'production',

  /**
   * Must be specified using `$ vite [dev | build] --mode preprod`
   */
  PRE_PROD = 'preprod',

  /**
   * Must be specified using `$ vite [dev | build] --mode staging`
   */
  STAGING = 'staging',

  /**
   * Enabled by `$ vite` or `$ vite dev`
   */
  DEV = 'development',
}
