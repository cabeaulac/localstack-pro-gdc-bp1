import {fileURLToPath, URL} from 'url';

import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue({
    include: '**/*.vue'
  })],
  server: {
    watch: {
      usePolling: true,
    },
    proxy: {
      // '/auth0': {
      //       target: 'http://host.docker.internal:3001',
      //       prependPath: false,
      //       ignorePath: false,
      //       changeOrigin: true,
      //       rewrite: (path) => path.replace(/^\/auth0/, ''),
      //       followRedirects: false,
      //       preserveHeaderKeyCase: true,
      //       secure: false,
      //       ws: false,
      //   },
      '/ws/': {
        target: `${process.env.VITE_WEBSOCKET_API_ENDPOINT}/ws/`,
        prependPath: false,
        ignorePath: false,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws/, ''),
        followRedirects: false,
        preserveHeaderKeyCase: true,
        secure: false,
        ws: true,
      },
      [`/${process.env.VITE_API_STAGE}`]: {
        target: process.env.VITE_API_BASE,
        prependPath: true,
        ignorePath: false,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lsgdc-local/, ''),
        followRedirects: false,
        preserveHeaderKeyCase: true,
        secure: false,
        ws: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
