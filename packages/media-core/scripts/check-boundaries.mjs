import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../src');

const forbidden = [
  /from\s+['"]react['"]/,
  /from\s+['"]react-dom['"]/,
  /from\s+['"]react-native['"]/,
  /require\(\s*['"]react['"]\s*\)/,
  /require\(\s*['"]react-dom['"]\s*\)/,
  /require\(\s*['"]react-native['"]\s*\)/,
  /from\s+['"]@mediaforge\/ui-react['"]/,
  /from\s+['"]@mediaforge\/ui-native['"]/,
  /from\s+['"]@mediaforge\/react['"]/,
  /from\s+['"]@mediaforge\/native['"]/,
  /\bdocument\./,
  /\bwindow\./,
  /\blocalStorage\b/,
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile() && full.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

const files = await walk(srcDir);
const violations = [];

for (const file of files) {
  const content = await readFile(file, 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(content)) {
      violations.push(`${path.relative(srcDir, file)} matches ${pattern}`);
    }
  }
}

if (violations.length > 0) {
  console.error('Architecture boundary violations in @mediaforge/core:\n');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Boundary check passed for @mediaforge/core');
