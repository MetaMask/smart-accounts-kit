#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Postbuild fix-up for emitted entrypoints in dist/ to add explicit file extensions.
 * - Keeps tsup bundle:false and per-ABI outputs for better consumer tree-shaking.
 * - Our source barrels use extensionless relative specifiers (./abis/Name).
 * - This script rewrites:
 *   - ESM (index.mjs, bytecode.mjs): ... from './abis/Name' -> ... from './abis/Name.mjs'
 *   - CJS (index.cjs, bytecode.cjs): require('./abis/Name') -> require('./abis/Name.cjs')
 * This avoids exposing per-contract subpath exports or import maps and removes
 * the need for bundling while ensuring Node can resolve entrypoint imports.
 */
import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');

function patchEsm(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  // from './abis/Name' -> from './abis/Name.mjs'
  content = content.replace(/(from\s+['"]\.\/(abis|bytecode)\/([^.'"]+))(['"])/g, '$1.mjs$4');
  // export ... from './abis/Name' -> export ... from './abis/Name.mjs'
  content = content.replace(/(export\s+\{[^}]*\}\s+from\s+['"]\.\/(abis|bytecode)\/([^.'"]+))(['"])/g, '$1.mjs$4');
  fs.writeFileSync(filePath, content);
  console.log(`Patched ESM import extensions in ${filePath}`);
}

function patchCjs(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  // require('./abis/Name') -> require('./abis/Name.cjs')
  content = content.replace(/(require\(\s*['"]\.\/(abis|bytecode)\/([^.'"]+))(['"]\s*\))/g, '$1.cjs$4');
  fs.writeFileSync(filePath, content);
  console.log(`Patched CJS require extensions in ${filePath}`);
}

patchEsm(path.join(distDir, 'index.mjs'));
patchEsm(path.join(distDir, 'bytecode.mjs'));
patchCjs(path.join(distDir, 'index.cjs'));
patchCjs(path.join(distDir, 'bytecode.cjs'));

