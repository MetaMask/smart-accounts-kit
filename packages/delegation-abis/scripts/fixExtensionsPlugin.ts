// From https://github.com/aymericzip/esbuild-fix-imports-plugin/blob/main/src/fixExtensionsPlugin.ts, included here to avoid adding a dependency
import type { Plugin } from 'esbuild';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const CJS_RELATIVE_IMPORT_EXP = /require\s*\(\s*["'](\..+?)["']\s*\)(;?)/g;
const ESM_RELATIVE_IMPORT_EXP = /from\s*(["'])(\.[^"']+)\1([^;]*;?)/g;
const hasJSExtensionRegex = /\.(?:js)$/i;
const hasNonJSExtensionRegex =
  /\.(?:png|svg|css|scss|csv|tsv|xml|toml|ini|jpe?g|json|md|mdx|yaml|gif|webp|ico|mp4|webm|ogg|wav|mp3|m4a|aac|webm|woff2?|eot|ttf|otf|wasm)$/i;

function modifyEsmImports(contents: string, outExt: string) {
  return contents.replace(ESM_RELATIVE_IMPORT_EXP, (_m, quote, importPath, rest = '') => {
    if (importPath.endsWith('.') || importPath.endsWith('/')) {
      return `from ${quote}${importPath}/index${outExt}${quote}${rest}`;
    }
    if (importPath.endsWith(outExt)) {
      return `from ${quote}${importPath}${quote}${rest}`;
    }
    if (hasJSExtensionRegex.test(importPath) && outExt !== '.js') {
      return `from ${quote}${importPath.replace(hasJSExtensionRegex, outExt)}${quote}${rest}`;
    }
    if (hasNonJSExtensionRegex.test(importPath)) {
      return `from ${quote}${importPath}${quote}${rest}`;
    }
    return `from ${quote}${importPath}${outExt}${quote}${rest}`;
  });
}

function modifyCjsImports(contents: string, outExt: string) {
  return contents.replace(CJS_RELATIVE_IMPORT_EXP, (_m, importPath, maybeSemi = '') => {
    if (importPath.endsWith('.') || importPath.endsWith('/')) {
      return `require('${importPath}/index${outExt}')${maybeSemi}`;
    }
    if (hasJSExtensionRegex.test(importPath) && outExt !== '.js') {
      return `require('${importPath.replace(hasJSExtensionRegex, outExt)}')${maybeSemi}`;
    }
    if (importPath.endsWith(outExt) || hasNonJSExtensionRegex.test(importPath)) {
      return `require('${importPath}')${maybeSemi}`;
    }
    return `require('${importPath}${outExt}')${maybeSemi}`;
  });
}

function modifyRelativeImports(contents: string, isEsm: boolean, outExt: string) {
  return isEsm ? modifyEsmImports(contents, outExt) : modifyCjsImports(contents, outExt);
}

// Fallback if esbuild doesn't provide outputFiles (write: true)
function processOutdirFiles(outdir: string, isEsm: boolean, outExt: string) {
  const stack = [outdir];
  while (stack.length) {
    const dir = stack.pop()!;
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) {
        stack.push(p);
        continue;
      }
      const ext = extname(p);
      if (ext !== outExt) {
        continue;
      }
      if (ext === '.mjs' || ext === '.cjs' || ext === '.js') {
        const original = readFileSync(p, 'utf8');
        const updated = modifyRelativeImports(original, isEsm || ext === '.mjs', outExt);
        if (updated !== original) {
          writeFileSync(p, updated);
        }
      }
    }
  }
}

export const fixExtensionsPlugin = (): Plugin => ({
  name: 'fixExtensionsPlugin',
  setup(build) {
    const isEsm = build.initialOptions.format === 'esm';
    const outExt = build.initialOptions.outExtension?.['.js'] ?? (isEsm ? '.mjs' : '.cjs');
    const outdir = build.initialOptions.outdir;

    build.onEnd((result) => {
      if (result.errors.length > 0) return;

      if (result.outputFiles && result.outputFiles.length > 0) {
        for (const ofile of result.outputFiles) {
          if (!ofile.path.endsWith(outExt)) continue;
          const next = modifyRelativeImports(ofile.text, isEsm, outExt);
          ofile.contents = Buffer.from(next);
        }
      } else if (outdir) {
        processOutdirFiles(outdir, isEsm, outExt);
      }
    });
  },
});

