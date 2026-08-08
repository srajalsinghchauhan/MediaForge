import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('architecture boundaries', () => {
  it('depends on core, react, and react-native without UI or web wrapper packages', async () => {
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
    expect(all['react-native']).toBeTruthy();
    expect(all['@mediaforge/react']).toBeUndefined();
    expect(all['@mediaforge/ui-react']).toBeUndefined();
    expect(all['@mediaforge/ui-native']).toBeUndefined();
  });
});
