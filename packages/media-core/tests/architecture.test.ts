import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');

const forbiddenPatterns = [
  /from\s+['"]react['"]/,
  /from\s+['"]react-dom['"]/,
  /from\s+['"]react-native['"]/,
  /require\(\s*['"]react['"]\s*\)/,
  /require\(\s*['"]react-dom['"]\s*\)/,
  /require\(\s*['"]react-native['"]\s*\)/,
  /\bdocument\./,
  /\bwindow\./,
  /\blocalStorage\b/,
];

async function listTsFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTsFiles(full)));
    } else if (entry.name.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

describe('architecture boundaries', () => {
  it('does not import React, React Native, or DOM globals in src', async () => {
    const files = await listTsFiles(srcDir);
    const violations: string[] = [];

    for (const file of files) {
      const content = await readFile(file, 'utf8');
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(content)) {
          violations.push(`${path.relative(srcDir, file)} :: ${pattern}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
