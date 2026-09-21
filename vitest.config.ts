import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['Tests/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 15000,
  },
});
