/**
 * Enables typescript intellisense for custom environment variables.
 *
 * This file needs to be imported in vite-env.d.ts.
 *
 * Be careful not to use any "import" statements outside of the inline variant.
 * @see https://vitejs.dev/guide/env-and-mode#intellisense-for-typescript
 * @see https://www.typescriptlang.org/docs/handbook/2/modules.html#how-javascript-modules-are-defined
 */
interface ImportMeta {
  readonly env: import('./types').AppEnv;
}
