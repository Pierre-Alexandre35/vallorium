import { QtmProgressCircle } from '@qtm/react';
import { Typography } from '../typography';

/**
 * Intended to be shown full-screen when content is being loaded.
 *
 * Keep in mind this screen might be shown during app-initialization,
 * and not be part of your usual rendering contexts.
 *
 * As such, avoid using :
 *  - toasts or snackbars
 *  - translations
 *  - state-managed objects
 */
export const SplashScreen = ({
  subtitle,
  hideLogo,
  children,
}: React.PropsWithChildren<{
  subtitle?: string;
  hideLogo?: boolean;
}>) => {
  return (
    <div className="h-full w-full flex flex-col gap-xxl items-center justify-center bg-bluegrey-25">
      {/* Purposefully not using translations here (see jsdoc above) */}
      {/* Prefer rendering animations and images */}
      {!hideLogo && <img src="/icons/logo.svg" alt="logo" className="w-3/12" />}
      <QtmProgressCircle size="xlarge" />
      <Typography component="caption-1" class="text-black-40">
        {subtitle || <br />}
      </Typography>
      {children}
    </div>
  );
};
