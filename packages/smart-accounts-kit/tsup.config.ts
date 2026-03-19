import type { Options } from 'tsup';
import config from '../../shared/config/base.tsup.config';

const options: Options = {
  ...config,
  // Bundle internal analytics into the published kit (not a separate install).
  noExternal: ['@metamask/smart-accounts-kit-analytics'],
  entry: [
    'src/index.ts',
    'src/experimental/index.ts',
    'src/utils/index.ts',
    'src/contracts/index.ts',
    'src/actions/index.ts',
  ],
  dts: {
    entry: [
      'src/index.ts',
      'src/experimental/index.ts',
      'src/utils/index.ts',
      'src/contracts/index.ts',
      'src/actions/index.ts',
    ]
  },
};

export default options;
