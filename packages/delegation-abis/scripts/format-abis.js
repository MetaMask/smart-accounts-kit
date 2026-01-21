import fs from 'node:fs';
import path from 'node:path';

// Directory containing the JSON ABI files
const inputDir = './src/artifacts';
const abiDir = './src/abis';
const bytecodeModulesDir = './src/bytecode';
const INDEX_FILE = './src/index.ts';
const BYTECODE_FILE = './src/bytecode.ts';

if (!fs.existsSync(abiDir)) {
  fs.mkdirSync(abiDir, { recursive: true });
}
if (!fs.existsSync(bytecodeModulesDir)) {
  fs.mkdirSync(bytecodeModulesDir, { recursive: true });
}

// Initialize index files (truncate)
fs.writeFileSync(INDEX_FILE, '');
fs.writeFileSync(BYTECODE_FILE, '');

// Write exports to index and bytecode files in sorted order
function writeIndexFiles(exportNames) {
  const sortedNames = exportNames
    .slice()
    .sort((a, b) => a.localeCompare(b));
  const indexContents = sortedNames
    .map((fileName) => `export { abi as ${fileName} } from './abis/${fileName}';`)
    .join('\n');
  const bytecodeContents = sortedNames
    .map(
      (fileName) => `export { bytecode as ${fileName} } from './bytecode/${fileName}';`,
    )
    .join('\n');

  fs.writeFileSync(INDEX_FILE, `${indexContents}\n`);
  fs.writeFileSync(BYTECODE_FILE, `${bytecodeContents}\n`);
}

// Recursive function to process files and directories
function processDirectory(directory) {
  const exportNames = [];
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (err) {
    console.error('Error reading directory:', err);
    return exportNames;
  }

  const ignoreList = ['utils', 'build-info'];
  entries
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((entry) => {
      if (!ignoreList.includes(path.basename(directory))) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          // Recurse into subdirectories
          exportNames.push(...processDirectory(fullPath));
        } else if (path.extname(entry.name) === '.json') {
          // Process JSON files
          const exportName = processFile(fullPath, entry.name);
          if (exportName) {
            exportNames.push(exportName);
          }
        }
      }
    });

  return exportNames;
}

// Function to process each JSON file
function processFile(filePath, fileName) {
  let data;
  try {
    data = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`Error reading file ${fileName}:`, err);
    return null;
  }

  try {
    const parsed = JSON.parse(data);
    const abi = parsed.abi;
    const bytecode = parsed.bytecode?.object ?? '';
    const abiOnlyContent = `export const abi = ${JSON.stringify(
      abi,
      null,
      2,
    )} as const;\n`;
    const bytecodeOnlyContent = `export const bytecode = '${bytecode}' as const;`;
    const abiOnlyPath = path.join(
      abiDir,
      `${path.basename(fileName, '.json')}.ts`,
    );
    const bytecodeOnlyPath = path.join(
      bytecodeModulesDir,
      `${path.basename(fileName, '.json')}.ts`,
    );

    // Write abi-only and bytecode-only modules
    const exportName = path.basename(fileName, '.json');
    try {
      fs.writeFileSync(abiOnlyPath, abiOnlyContent);
      console.log(
        `ABI-only file generated for ${fileName}: ${abiOnlyPath}`,
      );
    } catch (err) {
      console.error(`Error writing ABI-only file for ${fileName}:`, err);
      return null;
    }

    try {
      fs.writeFileSync(bytecodeOnlyPath, bytecodeOnlyContent);
      console.log(
        `Bytecode-only file generated for ${fileName}: ${bytecodeOnlyPath}`,
      );
    } catch (err) {
      console.error(`Error writing bytecode-only file for ${fileName}:`, err);
      return null;
    }
    return exportName;
  } catch (parseError) {
    console.error(`Error parsing JSON from ${fileName}:`, parseError);
    return null;
  }
}

// Start processing from the input directory
const exportNames = processDirectory(inputDir);
writeIndexFiles(exportNames);
