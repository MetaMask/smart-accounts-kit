import type { Options } from 'tsup';
import config from '../../shared/config/base.tsup.config';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function listTsFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => join(dir, f));
}

const abiEntries = listTsFiles('src/abis');
const bytecodeEntries = listTsFiles('src/bytecode');

const options: Options = {
  ...config,
  entry: ['src/index.ts', 'src/bytecode.ts', ...abiEntries, ...bytecodeEntries],
  bundle: false,
  dts: {
    entry: ['src/index.ts', 'src/bytecode.ts', ...abiEntries, ...bytecodeEntries],
  },
};

export default options;
