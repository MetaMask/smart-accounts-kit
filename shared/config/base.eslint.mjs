import { resolve } from 'node:path';

const project = resolve(process.cwd(), 'tsconfig.json');

const [
  { default: baseConfig },
  { default: nodeConfig },
  { default: tsConfig },
] = await Promise.all([
  import('@metamask/eslint-config'),
  import('@metamask/eslint-config-nodejs'),
  import('@metamask/eslint-config-typescript'),
]);

export default [
  {
    ignores: [
      'node_modules',
      'dist',
      '*.config.ts',
      '.eslintrc.js',
      'docs/',
      '.yarn/',
      'build/',
    ],
  },

  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },

  ...baseConfig,

  {
    settings: {
      'import/resolver': {
        typescript: {
          project,
        },
      },
    },
  },

  ...tsConfig.map((config) => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
  })),

  ...nodeConfig.map((config) => ({
    ...config,
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
  })),
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      sourceType: 'script',
      ecmaVersion: 2020,
    },
  },

  {
    files: ['**/*.d.ts'],
    rules: {
      'import-x/unambiguous': 'off',
    },
  },
];
