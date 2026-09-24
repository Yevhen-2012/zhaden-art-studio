import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pages = fs.readdirSync(root).filter(name => name.endsWith('.html'));
const errors = [];
let references = 0;
let lightboxes = 0;
const exactExists = target => {
  const rel = path.relative(root, target);
  let cursor = root;
  for (const segment of rel.split(path.sep)) {
    if (!fs.existsSync(cursor) || !fs.readdirSync(cursor).includes(segment)) return false;
    cursor = path.join(cursor, segment);
  }
  return fs.existsSync(cursor);
};
function checkReference(source, reference) {
  if (!reference || /^(?:[a-z]+:|\/\/)/i.test(reference)) return;
  references++;
  const [pathname, fragment] = reference.split('#');
  const target = pathname ? path.resolve(path.dirname(path.join(root, source)), decodeURIComponent(pathname.split('?')[0])) : path.join(root, source);
  if (!target.startsWith(root) || !exactExists(target)) {
    errors.push(`${source}: missing or incorrectly cased file ${reference}`);
  } else if (fragment && target.endsWith('.html')) {
    const html = fs.readFileSync(target, 'utf8');
    const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
    if (!ids.includes(decodeURIComponent(fragment))) errors.push(`${source}: missing anchor ${reference}`);
  }
}
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  for (const match of html.matchAll(/\b(?:src|href|poster)="([^"]*)"/g)) checkReference(page, match[1]);
  for (const match of html.matchAll(/\bsrcset="([^"]+)"/g)) {
    for (const candidate of match[1].split(',')) checkReference(page, candidate.trim().split(/\s+/)[0]);
  }
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (match[1].includes('application/json')) {
      try {
        const data = JSON.parse(match[2]);
        for (const item of data.items || []) {
          lightboxes++;
          checkReference(page, item.url);
          if (/^https?:/.test(item.url)) errors.push(`${page}: external gallery image ${item.url}`);
        }
      } catch (error) { errors.push(`${page}: invalid lightbox JSON (${error.message})`); }
    } else if (!match[1].includes('src=')) {
      try { new vm.Script(match[2], { filename: page }); }
      catch (error) { errors.push(`${page}: invalid inline JavaScript (${error.message})`); }
    }
  }
  if (/https?:\/\/sarny-history-museum\.webflow\.io/.test(html)) errors.push(`${page}: old Webflow domain remains`);
  if (/class="[^"]*\bw-dyn-list\b/.test(html)) errors.push(`${page}: CMS list requires migration review`);
}
for (const name of fs.readdirSync(path.join(root, 'css'))) {
  const source = `css/${name}`;
  for (const match of fs.readFileSync(path.join(root, source), 'utf8').matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)) checkReference(source, match[1]);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log(`Passed: ${pages.length} pages, ${references} local references, ${lightboxes} gallery images, inline JavaScript syntax, CSS assets, and Linux filename case.`);
