import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'src');

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

describe('architecture boundaries', () => {
  it('does not depend on SDK or web UI packages', async () => {
    const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const all = {
      ...pkg.dependencies,
      ...pkg.peerDependencies,
      ...pkg.devDependencies,
    };

    expect(all['react-native']).toBeTruthy();
    expect(all['@mediaforge/core']).toBeUndefined();
    expect(all['@mediaforge/react']).toBeUndefined();
    expect(all['@mediaforge/native']).toBeUndefined();
    expect(all['@mediaforge/ui-react']).toBeUndefined();
    expect(all['react-dom']).toBeUndefined();
  });

  it('source avoids SDK imports and DOM APIs', async () => {
    const files = await walk(srcDir);
    const violations: string[] = [];
    const forbidden =
      /@mediaforge\/(core|react|native|ui-react)|react-dom|document\.|window\.|HTMLElement|IntersectionObserver|api\.pexels\.com|MediaClient|useMediaClient/;

    for (const file of files) {
      const content = await readFile(file, 'utf8');
      if (forbidden.test(content)) {
        violations.push(path.relative(srcDir, file));
      }
    }

    expect(violations).toEqual([]);
  });
});
