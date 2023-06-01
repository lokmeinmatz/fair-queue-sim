import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 3000,
  },
  base: '/fair-queue-sim/',
  build: {
    outDir: 'docs',
    target: 'esnext',
  },
});
