import { defineConfig, loadEnv, PluginOption } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { OwnEnv } from './src/types';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
const config = defineConfig(({ mode }) => {
  /**
   * Load env file based on `mode` in the current working directory.
   *
   * Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const env = loadEnv(mode, process.cwd(), '') as OwnEnv;

  const serverPort = env.SERVER_PORT ? Number(env.SERVER_PORT) : 3000;

  const plugins: PluginOption[] = [
    react(),

    /**
     * Use 'vite-plugin-node-polyfills' to include some node-specific
     * libraries to the browser bundle.
     *
     * - 'utils' : needed by @aws-sdk/lib-storage, though not used when in browser environment
     */
    nodePolyfills({
      include: ['util'], // If no option is passed, adds all polyfills
    }),

    /**
     * Do something with your (secret) environement variables at build-time
    
    someOtherPlugin({
      beforeBuild: 'send metadata to some repo',
      afterBuild: 'send source-maps and stats to some other repo',
      authSecret: env.SECRET_NOT_EXPOSED,
    }),

     */
  ];

  return {
    build: {
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-router', 'react-router-dom'],
          },
        },
      },
    },
    esbuild: {
      treeShaking: true, // dead code elimination
    },
    resolve: {
      alias: {
        src: path.resolve(__dirname, './src'),
      },
    },
    plugins,
    preview: {
      port: serverPort,
      strictPort: true,
    },
    server: {
      port: serverPort,
      strictPort: true,
      host: true,
      origin: `http://0.0.0.0:${serverPort}`,
    },
  };
});

export default config;
