import { QtmTypography } from '@qtm/react';
import React, { forwardRef } from 'react';
import { ComponentProps } from 'src/types';

/**
 * Re-exports QtmTypography, but wrpas content in a <span> to prevent
 * a bug causing styles to disappear when content changes.
 *
 * @see https://gitlab.thalesdigital.io/thales-design-system/tds-web/-/issues/266#note_3523513
 */
const Typography = forwardRef<
  HTMLQtmTypographyElement,
  React.PropsWithChildren<ComponentProps<typeof QtmTypography>>
>(({ children, ...qtmTypoProps }, ref) => {
  return (
    <QtmTypography {...qtmTypoProps} ref={ref}>
      <span className="text-gray-800">{children}</span> {/* Custom color */}
    </QtmTypography>
  );
});

Typography.displayName = 'Typography';

export { Typography };
