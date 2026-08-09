import path from 'node:path';
import { defineConfig } from 'vitest/config';
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
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.tsx', 'src/**/*.test.ts'],
  },
});
