import type { Options } from 'tsup';
import config from '../../shared/config/base.tsup.config';

const options: Options = {
  ...config,
  entry: ['src/index.ts'],
  dts: {
    entry: ['src/index.ts'],
  },
};

export default options;
