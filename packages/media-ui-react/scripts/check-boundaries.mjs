import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../src');
const packageJsonPath = path.resolve(__dirname, '../package.json');

const forbiddenImports = [
  /from\s+['"]@mediaforge\/core['"]/,
  /from\s+['"]@mediaforge\/react['"]/,
  /from\s+['"]@mediaforge\/native['"]/,
  /from\s+['"]@mediaforge\/ui-native['"]/,
  /from\s+['"]react-native['"]/,
  /Pexels|PEXELS|api\.pexels\.com|Authorization|MediaClient|useMediaClient|createMediaClient/,
];

const forbiddenDeps = [
  '@mediaforge/core',
  '@mediaforge/react',
  '@mediaforge/native',
  '@mediaforge/ui-native',
  'react-native',
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const files = await walk(srcDir);
const violations = [];

for (const file of files) {
  const content = await readFile(file, 'utf8');
  for (const pattern of forbiddenImports) {
    if (pattern.test(content)) {
      violations.push(`${path.relative(srcDir, file)} matches ${pattern}`);
    }
  }
}

const pkg = JSON.parse(await readFile(packageJsonPath, 'utf8'));
const deps = {
  ...pkg.dependencies,
  ...pkg.peerDependencies,
  ...pkg.devDependencies,
};

for (const name of forbiddenDeps) {
  if (deps[name]) {
    violations.push(`package.json depends on forbidden package ${name}`);
  }
}

if (violations.length > 0) {
  console.error('Architecture boundary violations in @mediaforge/ui-react:\n');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Boundary check passed for @mediaforge/ui-react');
