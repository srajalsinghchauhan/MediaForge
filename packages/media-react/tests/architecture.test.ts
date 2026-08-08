import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('architecture boundaries', () => {
  it('depends on core and react only among mediaforge packages', async () => {
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

    expect(all['@mediaforge/core']).toBeTruthy();
    expect(all['@mediaforge/native']).toBeUndefined();
    expect(all['@mediaforge/ui-react']).toBeUndefined();
    expect(all['@mediaforge/ui-native']).toBeUndefined();
    expect(all['react-native']).toBeUndefined();
  });
});
