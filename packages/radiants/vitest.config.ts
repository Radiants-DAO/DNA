import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: [
      'components/core/**/*.test.tsx',
      'eslint/__tests__/**/*.test.mjs',
      'registry/__tests__/**/*.test.ts',
      'registry/__tests__/**/*.test.tsx',
      'test/**/*.test.ts',
      '../preview/src/__tests__/**/*.test.ts',
    ],
  },
});
