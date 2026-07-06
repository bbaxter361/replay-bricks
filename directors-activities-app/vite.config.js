import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/spring-proxy': {
        target: 'https://replaybricksv2.netlify.app',
        changeOrigin: true,
        headers: {
          'x-api-key': 'spring-vicki-2026',
        },
        rewrite: (path) => path.replace(/^\/api\/spring-proxy/, '/api'),
      },
    },
  },
});
