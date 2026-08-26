import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('manifest stays narrow and targets only supported AI hosts', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));

  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions.sort(), ['activeTab', 'scripting', 'storage']);
  assert.equal('host_permissions' in manifest, false);
  assert.equal(manifest.background.type, 'module');
  assert.deepEqual(manifest.content_scripts[0].matches.sort(), [
    'https://chat.openai.com/*',
    'https://chatgpt.com/*',
    'https://claude.ai/*',
    'https://gemini.google.com/*',
    'https://grok.com/*',
  ]);
});

test('extension entrypoints exist for the complete visible flow', () => {
  for (const file of [
    'src/scope-engine.mjs',
    'background/service-worker.mjs',
    'content/content.js',
    'popup/popup.html',
    'popup/popup.mjs',
  ]) {
    assert.equal(fs.existsSync(path.join(root, file)), true, file);
  }
});

