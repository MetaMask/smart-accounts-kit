import { defineConfig } from 'tsup';
import config from '../../shared/config/base.tsup.config';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fixExtensionsPlugin } from './scripts/fixExtensionsPlugin';

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

export default defineConfig({
  ...config,
  format: ['esm', 'cjs'],
  entry: ['src/index.ts', 'src/bytecode.ts', ...abiEntries, ...bytecodeEntries],
  bundle: false,
  splitting: false,
  esbuildPlugins: [fixExtensionsPlugin()],
  dts: {
    entry: ['src/index.ts', 'src/bytecode.ts', ...abiEntries, ...bytecodeEntries],
  },
});
