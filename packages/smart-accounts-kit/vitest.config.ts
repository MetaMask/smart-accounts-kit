import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      // Don't track analytics during unit tests.
      DO_NOT_TRACK: 'true',
    },
  },
});
