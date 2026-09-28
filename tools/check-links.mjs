// Fails if any internal href in dist/ points at a page or file that doesn't exist.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const html = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? html(p) : p.endsWith('.html') ? [p] : [];
});
const exists = (path) => {
  const clean = decodeURIComponent(path.split(/[?#]/)[0]);
  if (clean === '' || clean === '/') return true;
  const p = join(dist, clean);
  return existsSync(p) && statSync(p).isFile() || existsSync(join(p, 'index.html')) || existsSync(p + '.html');
};
const bad = [];
for (const file of html(dist)) {
  for (const [, href] of readFileSync(file, 'utf8').matchAll(/href="(\/[^"]*)"/g)) {
    if (!href.startsWith('//') && !exists(href)) bad.push(`${file.replace(dist, '')} -> ${href}`);
  }
}
if (bad.length) { console.error('Broken internal links:\n' + bad.join('\n')); process.exit(1); }
console.log('internal links ok');
