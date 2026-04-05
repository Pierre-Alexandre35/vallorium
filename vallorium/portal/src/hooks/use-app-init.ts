import { useCallback, useEffect, useState } from 'react';
import { useInitializeI18Next } from '.';
import { i18nConfig } from 'src/utils';
import { useLogger } from './utils';
import { QueryClient } from '@tanstack/react-query';

/**
 * Bare useEffect with no dependencies might work in production,
 * but such an effect would trigger twice in development (react 18+ strict mode)
 *
 * @see https://react.dev/learn/you-might-not-need-an-effect#initializing-the-application
 */
let didInit = false;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

/**
 * This hook is meant to be called in your first comonent (App.tsx)
 * for your app to execute some initialization code.
 *
 * It can return various resources.
 */
export const useAppInit = () => {
  const [appInitialized, setAppInitialized] = useState(didInit); // convert didInit to a stateful variable for render-logic to use

  const initI18n = useInitializeI18Next();

  const { log } = useLogger({ mode: 'hidden' });

  // initialization function, supports async calls
  const asyncInit = useCallback(async () => {
    // Here, write initialization code.
    log('start async init');

    initI18n(i18nConfig);

    log('async init is done.');
    setAppInitialized(true);
  }, [initI18n, log]);

  // initialization effect, runs at first render
  useEffect(() => {
    log('didInit is evaluated...');
    if (!didInit) {
      log('didInit is false, start init scripts and set it to true');
      didInit = true;
      asyncInit(); // cannot use async logic in effects
      log('didInit scripts were started.');
    }

    // Keep depndency array empty to avoid executing the content above multiple times
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Return your initialized resources
  return { appInitialized, queryClient };
};
