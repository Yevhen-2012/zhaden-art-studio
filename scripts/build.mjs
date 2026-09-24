import { mkdir, cp, readdir, copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
await mkdir(output, { recursive: true });
for (const name of await readdir(root)) {
  if (name.endsWith('.html')) await copyFile(path.join(root, name), path.join(output, name));
}
for (const name of ['css', 'js', 'images', 'fonts', 'documents']) {
  await cp(path.join(root, name), path.join(output, name), { recursive: true });
}
await writeFile(path.join(output, '.nojekyll'), '');
console.log('Static website copied to dist/ (only public website files).');
