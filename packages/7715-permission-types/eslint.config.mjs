// eslint-disable-next-line import-x/extensions
import baseConfig from '../../shared/config/base.eslint.mjs';

const config = [
  ...baseConfig,
  {
    files: ['test/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: ['./tsconfig.eslint.json'],
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.eslint.json',
        },
      },
    },
  },
];

export default config;
