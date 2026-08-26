import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist', 'scopepin-extension');
const files = [
  'manifest.json',
  'src/scope-engine.mjs',
  'background/service-worker.mjs',
  'content/content.js',
  'content/content.css',
  'popup/popup.html',
  'popup/popup.css',
  'popup/popup.mjs',
];

await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });

for (const relative of files) {
  const destination = path.join(output, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(path.join(root, relative), destination);
}

await fs.writeFile(
  path.join(output, 'BUILD.txt'),
  'ScopePin 0.1.0\nGenerated extension bundle. Load this directory as an unpacked extension.\n',
  'utf8',
);

console.log(`Built ${files.length} extension files at ${path.relative(root, output)}`);
