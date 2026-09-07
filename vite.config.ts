import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 4173,
    host: true,
    open: false
  },
  build: {
    target: 'esnext',
    sourcemap: true
  }
});
