import { InitOptions } from 'i18next';
import { HttpBackendOptions } from 'i18next-http-backend';

export const i18nConfig: InitOptions<HttpBackendOptions> = {
  backend: {
    // http backend options
  },
  fallbackLng: 'fr',
  debug: false,
};
