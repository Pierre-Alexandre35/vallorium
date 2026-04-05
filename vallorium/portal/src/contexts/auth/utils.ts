import { Logger } from 'src/utils';

/**
 * @public
 */
export const hasAuthParams = (options?: {
  /**
   * @default window.location
   */
  location?: Location;
  logger?: Logger;
}): boolean => {
  const {
    location = window.location,
    logger = new Logger({ mode: 'hidden' }),
  } = options || {};

  logger.warn('Calling hasAuthParams with location :');
  logger.table({ ...location });

  // response_mode: query
  let searchParams = new URLSearchParams(location.search);
  if (
    (searchParams.get('code') || searchParams.get('error')) &&
    searchParams.get('state')
  ) {
    return true;
  }

  // response_mode: fragment
  searchParams = new URLSearchParams(location.hash.replace('#', '?'));
  if (
    (searchParams.get('code') || searchParams.get('error')) &&
    searchParams.get('state')
  ) {
    return true;
  }

  return false;
};

const normalizeErrorFn =
  (fallbackMessage: string) =>
  (error: unknown): Error => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(fallbackMessage);
  };

export const signinError = normalizeErrorFn('Sign-in failed');
export const signoutError = normalizeErrorFn('Sign-out failed');
