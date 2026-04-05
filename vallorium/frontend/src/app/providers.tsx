import type { PropsWithChildren } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';

import { appTheme } from '@/theme';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
