
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/book-finder/',
  plugins: [react()],
  server: {
    proxy: {
      '/book-finder/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/book-finder/, ''),
      },
    },
  },
});
