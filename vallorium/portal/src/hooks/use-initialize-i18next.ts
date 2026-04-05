import i18next, { InitOptions } from 'i18next';
import HTTPBackend, { HttpBackendOptions } from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

/**
 * Initializes a i18next instance by declaring our various plugins and options.
 * 
 * @example const initI18n = useInitializeI18Next();
  // ...
  useEffect(() => {
    initI18n()
  }, [])  
  
 *
 * This hook is intended to be used on bootstrap of your app.
 * Wrapping the initialization in a hook keeps the code side-effect-free
 * @see https://codesweetly.com/side-effect/
 */
export const useInitializeI18Next =
  () => (initConfig: InitOptions<HttpBackendOptions>) => {
    i18next
      // load translation using http -> see /public/locales
      // learn more: https://github.com/i18next/i18next-http-backend
      .use(HTTPBackend)
      // detect user language
      // learn more: https://github.com/i18next/i18next-browser-languageDetector
      .use(LanguageDetector)
      // pass the i18n instance to react-i18next.
      .use(initReactI18next)
      // init i18next
      // for all options read: https://www.i18next.com/overview/configuration-options
      .init<HttpBackendOptions>(initConfig);
  };
