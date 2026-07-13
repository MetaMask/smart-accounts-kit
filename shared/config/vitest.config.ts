import { defineConfig } from 'vitest/config';

const coverageEnabled = Number(process.versions.node.split('.')[0]) >= 20;

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      // Don't track analytics during unit tests.
      DO_NOT_TRACK: 'true',
    },
    coverage: {
      enabled: coverageEnabled,
      provider: 'v8',
    },
  },
});
