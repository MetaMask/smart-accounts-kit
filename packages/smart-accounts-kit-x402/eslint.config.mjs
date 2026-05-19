// eslint-disable-next-line
import baseConfig from '../../shared/config/base.eslint.mjs';

const withX402NamingExceptions = baseConfig.map((entry) => {
  const namingConventionRule =
    entry.rules?.['@typescript-eslint/naming-convention'];

  if (!Array.isArray(namingConventionRule)) {
    return entry;
  }

  const [level, ...conventions] = namingConventionRule;

  return {
    ...entry,
    rules: {
      ...entry.rules,
      '@typescript-eslint/naming-convention': [
        level,
        {
          selector: ['class', 'typeAlias'],
          filter: {
            regex: '^x402[A-Z].*$',
            match: true,
          },
          format: null,
        },
        ...conventions,
      ],
    },
  };
});

const config = [
  ...withX402NamingExceptions,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'new-cap': [
        'error',
        {
          newIsCap: true,
          newIsCapExceptionPattern: '^x402[A-Z]',
          capIsNew: true,
          properties: true,
        },
      ],
    },
  },
];

export default config;
