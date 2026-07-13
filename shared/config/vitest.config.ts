import { defineConfig } from 'vitest/config';

// @vitest/coverage-v8 imports `node:inspector/promises`, which Node 18 does not
// provide. Coverage is enabled on Node 20+ only so CI can still run tests on 18.x.
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
