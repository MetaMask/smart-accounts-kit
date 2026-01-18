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

// Append exports to index and bytecode files
function addExportToIndexFile(fileName) {
  const indexStream = fs.createWriteStream(INDEX_FILE, {
    flags: 'a',
  });
  const bytecodeStream = fs.createWriteStream(BYTECODE_FILE, {
    flags: 'a',
  });

  indexStream.write(`export { abi as ${fileName} } from './abis/${fileName}'\n`);
  bytecodeStream.write(`export { bytecode as ${fileName} } from './bytecode/${fileName}'\n`);

  indexStream.end();
  bytecodeStream.end();
}

// Recursive function to process files and directories
function processDirectory(directory) {
  fs.readdir(directory, { withFileTypes: true }, (err, entries) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }

    const ignoreList = ['utils', 'build-info'];
    entries.forEach((entry) => {
      if (!ignoreList.includes(path.basename(directory))) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          // Recurse into subdirectories
          processDirectory(fullPath);
        } else if (path.extname(entry.name) === '.json') {
          // Process JSON files
          processFile(fullPath, entry.name);
        }
      }
    });
  });
}

// Function to process each JSON file
function processFile(filePath, fileName) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file ${fileName}:`, err);
      return;
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
      const bytecodeOnlyContent = `export const bytecode = \"${bytecode}\" as const;`;
      const abiOnlyPath = path.join(
        abiDir,
        `${path.basename(fileName, '.json')}.ts`,
      );
      const bytecodeOnlyPath = path.join(
        bytecodeModulesDir,
        `${path.basename(fileName, '.json')}.ts`,
      );

      // Write abi-only and bytecode-only modules
      fs.writeFile(abiOnlyPath, abiOnlyContent, (err) => {
        if (err) {
          console.error(`Error writing ABI-only file for ${fileName}:`, err);
        } else {
          console.log(
            `ABI-only file generated for ${fileName}: ${abiOnlyPath}`,
          );
        }
      });
      fs.writeFile(bytecodeOnlyPath, bytecodeOnlyContent, (err) => {
        if (err) {
          console.error(
            `Error writing bytecode-only file for ${fileName}:`,
            err,
          );
        } else {
          console.log(
            `Bytecode-only file generated for ${fileName}: ${bytecodeOnlyPath}`,
          );
        }
      });
      addExportToIndexFile(path.basename(fileName, '.json'));
    } catch (parseError) {
      console.error(`Error parsing JSON from ${fileName}:`, parseError);
    }
  });
}

// Start processing from the input directory
processDirectory(inputDir);
