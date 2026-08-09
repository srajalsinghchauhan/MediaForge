import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../src');
const packageJsonPath = path.resolve(__dirname, '../package.json');

const forbidden = [
  /from\s+['"]@mediaforge\/core['"]/,
  /from\s+['"]@mediaforge\/native['"]/,
  /from\s+['"]@mediaforge\/ui-native['"]/,
  /api\.pexels\.com/,
  /PEXELS_API_KEY\s*=\s*['"][^'"]+['"]/,
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
  for (const pattern of forbidden) {
    if (pattern.test(content)) {
      violations.push(`${path.relative(srcDir, file)} matches ${pattern}`);
    }
  }
}

const pkg = JSON.parse(await readFile(packageJsonPath, 'utf8'));
const deps = {
  ...pkg.dependencies,
  ...pkg.devDependencies,
};

if (!deps['@mediaforge/react'] || !deps['@mediaforge/ui-react']) {
  violations.push('apps/web must depend on @mediaforge/react and @mediaforge/ui-react');
}

if (deps['@mediaforge/core']) {
  violations.push('apps/web must not depend directly on @mediaforge/core');
}

if (violations.length > 0) {
  console.error('Architecture boundary violations in @mediaforge/web:\n');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Boundary check passed for @mediaforge/web');
