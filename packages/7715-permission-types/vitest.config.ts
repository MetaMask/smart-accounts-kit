import { defineConfig } from 'vitest/config';

const coverageEnabled = Number(process.versions.node.split('.')[0]) >= 20;

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      enabled: coverageEnabled,
      provider: 'v8',
    },
  },
});
