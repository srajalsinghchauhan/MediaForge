import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@mediaforge/react': path.resolve(
        __dirname,
        '../../packages/media-react/src/index.ts',
      ),
      '@mediaforge/ui-react': path.resolve(
        __dirname,
        '../../packages/media-ui-react/src/index.ts',
      ),
      '@mediaforge/core': path.resolve(
        __dirname,
        '../../packages/media-core/src/index.ts',
      ),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [path.resolve(__dirname, '../..')],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
