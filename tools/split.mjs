// Splits index.html into css/, js/ and the two data payloads, in place.
//
// The markup, the CSS and every script block are ordinary text, so they are cut
// out by line. The two <script type="application/json"> payloads (the bundled
// apps and the base64 wallpapers) are 4.6 MB of text, so they are matched with
// a regex over the raw source and moved into js/data.js as plain globals - the
// OS keeps reading them synchronously, so nothing about boot order changes.
//
// Idempotent: once the split has happened there is nothing to match and a
// second run exits without touching anything.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const FILE = 'index.html';
let src = readFileSync(FILE, 'utf8');

const APP_RE = /<script id="apps-data" type="application\/json">([\s\S]*?)<\/script>/;
const MEDIA_RE = /<script id="media-data" type="application\/json">([\s\S]*?)<\/script>/;

const appMatch = APP_RE.exec(src);
const mediaMatch = MEDIA_RE.exec(src);

if (!appMatch && !mediaMatch) {
  console.log(src.indexOf('js/core.js') !== -1
    ? 'Already split - nothing to do.'
    : 'Nothing to split - index.html has no inline blocks left.');
  process.exit(0);
}
if (!appMatch || !mediaMatch) {
  throw new Error('only one of the two data blocks was found - aborting, nothing written');
}

const appJson = appMatch[1].trim();
const mediaJson = mediaMatch[1].trim();

if (appJson[0] !== '{' || mediaJson[0] !== '{') {
  throw new Error('the embedded data is not a JSON object - aborting, nothing written');
}
if (mediaJson.length < 3000000) {
  throw new Error('the media payload looks truncated (' + mediaJson.length + ' chars) - aborting, nothing written');
}
if (appJson.length < 100000) {
  throw new Error('the app payload looks truncated (' + appJson.length + ' chars) - aborting, nothing written');
}

mkdirSync('js', { recursive: true });
writeFileSync('js/data.js',
  '// Extracted from index.html by tools/split.mjs.\n' +
  '// Loaded before js/core.js: the OS reads both globals synchronously.\n' +
  'window.APP_HTML = ' + appJson + ';\n\n' +
  'window.MEDIA_B64 = ' + mediaJson + ';\n');
console.log('Wrote js/data.js (' + (appJson.length + mediaJson.length) + ' chars of payload).');

src = src.replace(APP_RE, '<script src="js/data.js"></script>').replace(MEDIA_RE, '');

const lines = src.split('\n');
const blocks = [];
let i = 0;

while (i < lines.length) {
  const t = lines[i].trim();

  if (t === '<style>') {
    let j = i + 1;
    while (j < lines.length && lines[j].trim() !== '</style>') j++;
    if (j >= lines.length) throw new Error('unterminated <style> at line ' + (i + 1));
    blocks.push({ kind: 'style', start: i, end: j, id: null });
    i = j + 1;
    continue;
  }

  if (t === '<script>' || (t.indexOf('<script') === 0 && !/\ssrc=/.test(t) && t.indexOf('type="application/json"') === -1)) {
    let j = i + 1;
    while (j < lines.length && lines[j].trim() !== '</script>') j++;
    if (j >= lines.length) throw new Error('unterminated <script> at line ' + (i + 1));
    const idMatch = /id="([^"]+)"/.exec(t);
    blocks.push({ kind: 'script', start: i, end: j, id: idMatch ? idMatch[1] : null });
    i = j + 1;
    continue;
  }

  i++;
}

console.log('Blocks found: ' + blocks.map(function (b) {
  return b.kind + (b.id ? '#' + b.id : '') + '@' + (b.start + 1);
}).join(', '));

if (!blocks.some(function (b) { return b.kind === 'style'; })) {
  throw new Error('no <style> block found - aborting, nothing written');
}

if (!blocks.length) {
  console.log('No inline <style> or <script> blocks left - nothing to do.');
  process.exit(0);
}

const names = {
  'lunaar-game-fix': 'game-fix.js',
  'touch-support': 'touch.js'
};
const anonymous = ['core.js', 'accounts.js'];
let anonIndex = 0;

// The payloads now come from js/data.js, so the two lines that parsed them by
// id have to go (those elements no longer exist).
function stripDataParsing(body) {
  const before = body;
  body = body.replace(
    /^[ \t]*var APP_HTML=JSON\.parse\(document\.getElementById\('apps-data'\)\.textContent\);[ \t]*$/m,
    '/* APP_HTML is loaded by js/data.js */'
  );
  body = body.replace(
    /^[ \t]*var MEDIA_B64=JSON\.parse\(document\.getElementById\('media-data'\)\.textContent\);[ \t]*$/m,
    '/* MEDIA_B64 is loaded by js/data.js */'
  );
  return body === before ? null : body;
}

let dataPatched = 0;
const replacements = new Map();

for (const block of blocks) {
  let body = lines.slice(block.start + 1, block.end).join('\n');

  if (block.kind === 'style') {
    mkdirSync('css', { recursive: true });
    writeFileSync('css/os.css', body + '\n');
    replacements.set(block.start, '<link rel="stylesheet" href="css/os.css">');
    replacements.set(block.end, null);
    continue;
  }

  const patched = stripDataParsing(body);
  if (patched !== null) {
    body = patched;
    dataPatched++;
  }

  let name = block.id ? names[block.id] : null;
  if (!name) {
    name = anonymous[anonIndex] || ('script-' + anonIndex + '.js');
    anonIndex++;
  }

  mkdirSync('js', { recursive: true });
  writeFileSync('js/' + name, body + '\n');
  replacements.set(block.start, '<script src="js/' + name + '"></script>');
  replacements.set(block.end, null);
}

if (dataPatched !== 1) {
  throw new Error('expected exactly one script block to read the payloads, patched ' + dataPatched + ' - aborting, index.html untouched');
}

const out = [];
for (let n = 0; n < lines.length; n++) {
  if (replacements.has(n)) {
    const value = replacements.get(n);
    if (value !== null) out.push(value);
    continue;
  }
  out.push(lines[n]);
}

const result = out.join('\n');

const must = [
  '<script src="js/data.js"></script>',
  '<link rel="stylesheet" href="css/os.css">',
  'js/core.js',
  'js/accounts.js',
  'js/game-fix.js',
  'js/touch.js'
];
for (const needle of must) {
  if (result.indexOf(needle) === -1) throw new Error('missing "' + needle + '" in the rebuilt index.html - aborting, index.html untouched');
}
for (const needle of ['<script id="apps-data"', '<script id="media-data"']) {
  const at = result.indexOf(needle);
  if (at !== -1) {
    throw new Error('data block still inline at offset ' + at + ': ' +
      JSON.stringify(result.slice(Math.max(0, at - 120), at + 200)) + ' - aborting, index.html untouched');
  }
}
if (result.length > 500000) {
  throw new Error('index.html is still ' + result.length + ' bytes - aborting, index.html untouched');
}

writeFileSync(FILE, result);
console.log('Split ' + blocks.length + ' blocks. index.html is now ' + result.length + ' bytes.');
