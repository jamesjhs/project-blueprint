import react from '@vitejs/plugin-react';
import packageJson from './package.json';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:<<PORT>>',
        changeOrigin: true,
      },
    },
  },
});
