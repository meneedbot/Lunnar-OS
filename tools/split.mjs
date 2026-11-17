// Splits index.html into css/, js/ and the two data payloads, in place.
//
// The markup, the CSS and every script block are ordinary text, so they are cut
// out by line range and each range is replaced by a single tag. The two
// <script type="application/json"> payloads (the bundled apps and the base64
// wallpapers) are 4.6 MB of text, so they are matched with a regex over the raw
// source and moved into js/data.js as plain globals - the OS keeps reading them
// synchronously, so nothing about boot order changes.
//
// Safe to run repeatedly, and also repairs a half-split index.html (one that
// still holds the extracted CSS/JS inline next to the new tags): with the data
// payload already in js/data.js it simply removes the leftover ranges.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const FILE = 'index.html';
let src = readFileSync(FILE, 'utf8');

const APP_RE = /<script id="apps-data" type="application\/json">([\s\S]*?)<\/script>/;
const MEDIA_RE = /<script id="media-data" type="application\/json">([\s\S]*?)<\/script>/;

const appMatch = APP_RE.exec(src);
const mediaMatch = MEDIA_RE.exec(src);
const hadData = !!appMatch;

if (!!appMatch !== !!mediaMatch) {
  throw new Error('only one of the two data blocks was found - aborting, nothing written');
}

if (appMatch) {
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
} else if (!existsSync('js/data.js')) {
  throw new Error('index.html has no data payload and js/data.js is missing - aborting, nothing written');
} else {
  console.log('Data payload already in js/data.js.');
}

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

if (!blocks.length) {
  console.log('Already split - index.html has no inline blocks.');
  process.exit(0);
}

console.log('Blocks found: ' + blocks.map(function (b) {
  return b.kind + (b.id ? '#' + b.id : '') + '@' + (b.start + 1);
}).join(', '));

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

for (const block of blocks) {
  let body = lines.slice(block.start + 1, block.end).join('\n');

  if (block.kind === 'style') {
    mkdirSync('css', { recursive: true });
    writeFileSync('css/os.css', body + '\n');
    block.tag = '<link rel="stylesheet" href="css/os.css">';
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
  block.tag = '<script src="js/' + name + '"></script>';
}

if (hadData && dataPatched !== 1) {
  throw new Error('expected exactly one script block to read the payloads, patched ' + dataPatched + ' - aborting, index.html untouched');
}

// Rebuild: each block's whole line range collapses to its tag.
const byStart = new Map(blocks.map(function (b) { return [b.start, b]; }));
const out = [];
let n = 0;
while (n < lines.length) {
  const block = byStart.get(n);
  if (block) {
    out.push(block.tag);
    n = block.end + 1;
    continue;
  }
  out.push(lines[n]);
  n++;
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
  if (at !== -1) throw new Error('data block still inline at offset ' + at + ' - aborting, index.html untouched');
}

// Nothing inline may be left behind: the CSS and JS now live in files.
const leftovers = result.split('\n').filter(function (line) {
  const t = line.trim();
  return t === '<style>' || t === '</style>' || t === '</script>' || (t.indexOf('<script') === 0 && !/\ssrc=/.test(t));
});
if (leftovers.length) {
  throw new Error(leftovers.length + ' inline block line(s) survived, first: ' + JSON.stringify(leftovers[0]) + ' - aborting, index.html untouched');
}
if (result.length > 200000) {
  throw new Error('index.html is still ' + result.length + ' bytes for ' + result.split('\n').length + ' lines - aborting, index.html untouched');
}

writeFileSync(FILE, result);
console.log('Split ' + blocks.length + ' blocks. index.html is now ' + result.length + ' bytes in ' + result.split('\n').length + ' lines.');
