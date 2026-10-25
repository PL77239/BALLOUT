import { defineConfig } from 'vite';

/** GitHub project pages live at https://<user>.github.io/<repo>/ — set VITE_BASE=/RepoName/ in CI. */
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  server: { host: '0.0.0.0', port: 47731, strictPort: true },
  build: { chunkSizeWarningLimit: 2000 },
});
