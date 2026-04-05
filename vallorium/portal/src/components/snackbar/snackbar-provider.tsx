import { useRef } from 'react';
import { SnackbarProvider as NotistackProvider } from 'notistack';

type Props = {
  children: React.ReactNode;
};

export function SnackbarProvider({ children }: Props) {
  const notistackRef = useRef<NotistackProvider>(null);

  return (
    <NotistackProvider
      ref={notistackRef}
      maxSnack={5}
      preventDuplicate
      autoHideDuration={3000}
      variant="success" // Set default variant
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      classes={{ containerRoot: 'z-[10000]' }} // high zindex
    >
      {children}
    </NotistackProvider>
  );
}
