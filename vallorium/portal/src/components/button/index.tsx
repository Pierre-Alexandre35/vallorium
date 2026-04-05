import { QtmButton } from '@qtm/react';
import React, { forwardRef } from 'react';
import { ComponentProps } from 'src/types';

/**
 * Re-exports QtmButton, but wraps content in a <span> to prevent
 * a bug causing styles to disappear when content changes.
 *
 * @see https://gitlab.thalesdigital.io/thales-design-system/tds-web/-/issues/266#note_3523513
 */
const Button = forwardRef<
  HTMLQtmButtonElement,
  React.PropsWithChildren<ComponentProps<typeof QtmButton>>
>(({ children, ...qtmButtonProps }, ref) => {
  return (
    <QtmButton {...qtmButtonProps} ref={ref}>
      <span>{children}</span>
    </QtmButton>
  );
});

Button.displayName = 'Button';

export { Button };
