import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDir = dirname(fileURLToPath(import.meta.url));
const browserSpecs = readdirSync(testsDir).filter(name => name.endsWith('.spec.mjs')).sort();

test('Playwright spec files have valid JavaScript syntax', async t => {
  assert.ok(browserSpecs.length > 0, 'Expected at least one Playwright spec');
  for (const name of browserSpecs) {
    await t.test(name, () => {
      const result = spawnSync(process.execPath, ['--check', join(testsDir, name)], { encoding: 'utf8' });
      assert.ifError(result.error);
      assert.equal(result.status, 0, result.stderr || `Syntax check failed for ${name}`);
    });
  }
});
