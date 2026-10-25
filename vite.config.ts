import { defineConfig } from 'vite';

export default defineConfig({
  server: { host: '0.0.0.0', port: 47731, strictPort: true },
  build: { chunkSizeWarningLimit: 2000 },
});
