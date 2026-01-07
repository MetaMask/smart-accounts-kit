// eslint-disable-next-line
import baseConfig from '../../shared/config/base.eslint.mjs';

const config = [
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/naming-convention': 'warn',
    },
  },
];

export default config;
