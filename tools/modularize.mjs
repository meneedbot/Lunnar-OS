// Splits the stylesheet and the bundled app data into many small files:
// css/parts/*.css and js/parts/data/*.js, then points index.html at them.
//
// Nothing is retyped - every part is cut out of the existing files - and the run
// aborts before writing anything unless:
//   * the CSS parts join back into css/os.css byte for byte,
//   * every generated part is referenced by index.html,
//   * index.html no longer points at css/os.css or js/data.js.
// CSS rules stay whole and in order, and the data parts only fill the same two
// globals, so the page behaves exactly as before. Safe to run once:
// tools/modularized.json marks it as done. `--force` rebuilds from css/os.css
// and js/data.js, which throws away edits made to the parts.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';

const INDEX = 'index.html';
const MANIFEST = 'tools/modularized.json';
const CSS_SRC = 'css/os.css';
const CSS_PARTS = 'css/parts';
const DATA_SRC = 'js/data.js';
const DATA_PARTS = 'js/parts/data';

// Each CSS part holds at least this many lines (and always whole rules), so the
// split reaches roughly the file count asked for without touching the scripts.
const CSS_LINES = 5;

if (existsSync(MANIFEST) && !process.argv.includes('--force')) {
  console.log('Already modularized - see ' + MANIFEST + '.');
  process.exit(0);
}

const written = [];

function pad(n) {
  return String(n).padStart(3, '0');
}

function slug(text, fallback) {
  const words = String(text || '').replace(/[^A-Za-z0-9_@-]+/g, '-').replace(/^-+|-+$/g, '');
  return (words || fallback).toLowerCase().slice(0, 40);
}

function write(rel, body) {
  writeFileSync(rel, body);
  written.push(rel);
}

// ---------- CSS: whole rules only, in their original order ----------
function splitCss(src) {
  const lines = src.split('\n');
  const chunks = [];
  let cur = [];
  let depth = 0;
  let comment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    cur.push(line);

    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (comment) {
        if (c === '*' && line[j + 1] === '/') {
          comment = false;
          j++;
        }
      } else if (c === '/' && line[j + 1] === '*') {
        comment = true;
        j++;
      } else if (c === '{') {
        depth++;
      } else if (c === '}') {
        depth--;
      }
    }

    if (depth === 0 && !comment && line.trim().endsWith('}') && cur.length >= CSS_LINES) {
      chunks.push(cur.join('\n'));
      cur = [];
    }
  }
  if (cur.length) chunks.push(cur.join('\n'));

  if (chunks.join('\n') !== src) {
    throw new Error('the CSS split does not rebuild ' + CSS_SRC + ' - aborting, nothing written');
  }
  return chunks;
}

// ---------- the bundled app HTML and wallpapers ----------
function splitData(src) {
  const box = { window: {} };
  vm.runInNewContext(src, box, { timeout: 20000 });
  const apps = box.window.APP_HTML;
  const media = box.window.MEDIA_B64;
  if (!apps || typeof apps !== 'object') throw new Error('js/data.js has no APP_HTML - aborting');
  if (!media || typeof media !== 'object') throw new Error('js/data.js has no MEDIA_B64 - aborting');

  const files = [];
  write(DATA_PARTS + '/000-init.js',
    'window.APP_HTML = window.APP_HTML || {};\nwindow.MEDIA_B64 = window.MEDIA_B64 || {};\n');
  files.push('000-init.js');

  for (const key of Object.keys(apps)) {
    const file = 'app-' + files.length.toString().padStart(3, '0') + '-' + slug(key, 'app') + '.js';
    write(DATA_PARTS + '/' + file,
      'window.APP_HTML[' + JSON.stringify(key) + '] = ' + JSON.stringify(apps[key]) + ';\n');
    files.push(file);
  }
  for (const key of Object.keys(media)) {
    const file = 'media-' + files.length.toString().padStart(3, '0') + '-' + slug(key, 'media') + '.js';
    write(DATA_PARTS + '/' + file,
      'window.MEDIA_B64[' + JSON.stringify(key) + '] = ' + JSON.stringify(media[key]) + ';\n');
    files.push(file);
  }
  return files;
}

// ---------- run ----------
let html = readFileSync(INDEX, 'utf8');
if (html.indexOf('css/parts/') !== -1 || html.indexOf('js/parts/') !== -1) {
  console.log('index.html already points at the parts - nothing to do.');
  process.exit(0);
}

for (const dir of [CSS_PARTS, DATA_PARTS]) {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

const cssChunks = splitCss(readFileSync(CSS_SRC, 'utf8'));
const cssFiles = [];
for (let i = 0; i < cssChunks.length; i++) {
  const first = cssChunks[i].split('\n').find(function (l) {
    return l.trim() && !l.trim().startsWith('/*');
  });
  const file = pad(i + 1) + '-' + slug(first, 'styles') + '.css';
  write(CSS_PARTS + '/' + file,
    '/* ' + CSS_SRC + ', part ' + (i + 1) + ' of ' + cssChunks.length + ' */\n' + cssChunks[i] + '\n');
  cssFiles.push(file);
}

const dataFiles = splitData(readFileSync(DATA_SRC, 'utf8'));

// ---------- point index.html at the parts ----------
const cssLinks = cssFiles.map(function (f) {
  return '  <link rel="stylesheet" href="css/parts/' + f + '">';
}).join('\n');
const cssTag = '<link rel="stylesheet" href="' + CSS_SRC + '">';
if (html.indexOf(cssTag) === -1) {
  throw new Error('index.html has no ' + CSS_SRC + ' link - aborting, nothing written');
}
html = html.replace(cssTag, cssLinks);

const dataTags = dataFiles.map(function (f) {
  return '<script src="' + DATA_PARTS + '/' + f + '"></script>';
}).join('\n');
const dataTag = '<script src="' + DATA_SRC + '"></script>';
if (html.indexOf(dataTag) === -1) {
  throw new Error('index.html has no ' + DATA_SRC + ' tag - aborting, nothing written');
}
html = html.replace(dataTag, dataTags);

for (const needle of [CSS_SRC, DATA_SRC]) {
  if (html.indexOf(needle) !== -1) {
    throw new Error('index.html still points at ' + needle + ' - aborting, nothing written');
  }
}
for (const file of written) {
  if (html.indexOf(file) === -1) {
    throw new Error('index.html does not reference ' + file + ' - aborting, nothing written');
  }
}
if (html.length < 8000) {
  throw new Error('index.html came out at ' + html.length + ' bytes - aborting, nothing written');
}

writeFileSync(INDEX, html);
writeFileSync(MANIFEST, JSON.stringify({
  at: new Date().toISOString(),
  files: written.length,
  css: cssFiles.length,
  data: dataFiles.length
}, null, 2) + '\n');

console.log('Wrote ' + written.length + ' parts: ' + cssFiles.length + ' CSS and ' +
  dataFiles.length + ' data. index.html is ' + html.split('\n').length + ' lines.');
