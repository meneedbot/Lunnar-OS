// Splits the OS into many small files: css/parts/*.css, js/parts/*.js and
// js/parts/data/*.js, then points index.html at them.
//
// Every chunk is cut out of the existing files - nothing is retyped - and the run
// aborts before writing anything unless:
//   * the chunks of a file join back into that file byte for byte,
//   * each JavaScript chunk passes `node --check`,
//   * every generated file ends up referenced by index.html,
//   * no reference to the unsplit files is left in index.html.
// Safe to run once: tools/modularized.json marks it as done. `--force` rebuilds
// from css/os.css and js/*.js, which throws away edits made to the parts.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';

const INDEX = 'index.html';
const MANIFEST = 'tools/modularized.json';
const CSS_SRC = 'css/os.css';
const CSS_PARTS = 'css/parts';
const JS_PARTS = 'js/parts';
const DATA_PARTS = 'js/parts/data';
const DATA_SRC = 'js/data.js';
const JS_SRCS = ['js/core.js', 'js/accounts.js', 'js/game-fix.js', 'js/touch.js'];

const CSS_LINES = 9;
const JS_LINES = 18;

if (existsSync(MANIFEST) && !process.argv.includes('--force')) {
  console.log('Already modularized - see ' + MANIFEST + '.');
  process.exit(0);
}

const tmp = mkdtempSync(join(tmpdir(), 'modularize-'));
const written = [];

function pad(n) {
  return String(n).padStart(3, '0');
}

function slug(text, fallback) {
  const words = String(text || '').replace(/[^A-Za-z0-9_@-]+/g, '-').replace(/^-+|-+$/g, '');
  return (words || fallback).toLowerCase().slice(0, 40);
}

function jsOk(code) {
  const file = join(tmp, 'chunk.js');
  writeFileSync(file, code);
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    return true;
  } catch (err) {
    return false;
  }
}

function write(rel, body) {
  writeFileSync(rel, body);
  written.push(rel);
}

// ---------- CSS: one file per few whole rules ----------
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
        if (c === '*' && line[j + 1] === '/') { comment = false; j++; }
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

// ---------- JavaScript: one file per few whole top-level statements ----------
function splitJs(src, name) {
  const lines = src.split('\n');
  const chunks = [];
  let start = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== '') continue;
    if (i + 1 - start < JS_LINES) continue;
    const candidate = lines.slice(start, i + 1).join('\n');
    if (!jsOk(candidate)) continue;
    const rest = lines.slice(i + 1).join('\n');
    if (rest.trim() !== '' && !jsOk(rest)) continue;
    chunks.push(candidate);
    start = i + 1;
  }
  const tail = lines.slice(start).join('\n');
  if (tail.trim() !== '') chunks.push(tail);

  if (chunks.join('\n') !== src) {
    throw new Error('the split of ' + name + ' does not rebuild it - aborting, nothing written');
  }
  for (const chunk of chunks) {
    if (!jsOk(chunk)) {
      throw new Error('a chunk of ' + name + ' does not parse on its own - aborting, nothing written');
    }
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
  write(DATA_PARTS + '/000-init.js', 'window.APP_HTML = window.APP_HTML || {};\nwindow.MEDIA_B64 = window.MEDIA_B64 || {};\n');
  files.push('000-init.js');

  for (const key of Object.keys(apps)) {
    const file = 'app-' + slug(key, 'app') + '.js';
    write(DATA_PARTS + '/' + file,
      'window.APP_HTML[' + JSON.stringify(key) + '] = ' + JSON.stringify(apps[key]) + ';\n');
    files.push(file);
  }
  for (const key of Object.keys(media)) {
    const file = 'media-' + pad(files.length) + '-' + slug(key, 'media') + '.js';
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

for (const dir of [CSS_PARTS, JS_PARTS, DATA_PARTS]) {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

const cssChunks = splitCss(readFileSync(CSS_SRC, 'utf8'));
const cssFiles = [];
for (let i = 0; i < cssChunks.length; i++) {
  const first = cssChunks[i].split('\n').find(function (l) { return l.trim() && !l.trim().startsWith('/*'); });
  const file = pad(i + 1) + '-' + slug(first, 'styles') + '.css';
  write(CSS_PARTS + '/' + file, '/* ' + CSS_SRC + ', part ' + (i + 1) + ' of ' + cssChunks.length + ' */\n' + cssChunks[i] + '\n');
  cssFiles.push(file);
}

const scripts = [['data', DATA_SRC, splitData(readFileSync(DATA_SRC, 'utf8'))]];
for (const src of JS_SRCS) {
  const name = src.split('/').pop().replace(/\.js$/, '');
  const chunks = splitJs(readFileSync(src, 'utf8'), src);
  const files = [];
  for (let i = 0; i < chunks.length; i++) {
    const first = chunks[i].split('\n').find(function (l) { return l.trim() && !l.trim().startsWith('//'); });
    const file = name + '-' + pad(i + 1) + '-' + slug(first, 'part') + '.js';
    write(JS_PARTS + '/' + file, '// ' + src + ', part ' + (i + 1) + ' of ' + chunks.length + '\n' + chunks[i] + '\n');
    files.push(file);
  }
  scripts.push([name, src, files]);
}

// ---------- point index.html at the parts ----------
const cssLinks = cssFiles.map(function (f) { return '  <link rel="stylesheet" href="css/parts/' + f + '">'; }).join('\n');
if (html.indexOf('<link rel="stylesheet" href="' + CSS_SRC + '">') === -1) {
  throw new Error('index.html has no ' + CSS_SRC + ' link - aborting, nothing written');
}
html = html.replace('<link rel="stylesheet" href="' + CSS_SRC + '">', cssLinks);

const bySource = new Map(scripts.map(function (s) { return [s[1], s]; }));

for (const src of scripts.map(function (s) { return s[1]; })) {
  const entry = bySource.get(src);
  const tags = entry[2].map(function (f) {
    return '<script src="' + (src === DATA_SRC ? DATA_PARTS : JS_PARTS) + '/' + f + '"></script>';
  }).join('\n');
  const tag = '<script src="' + src + '"></script>';
  if (html.indexOf(tag) === -1) {
    throw new Error('index.html has no ' + tag + ' - aborting, nothing written');
  }
  html = html.replace(tag, tags);
}

for (const needle of [CSS_SRC, DATA_SRC].concat(JS_SRCS)) {
  if (html.indexOf(needle) !== -1) {
    throw new Error('index.html still points at ' + needle + ' - aborting, nothing written');
  }
}
for (const file of written) {
  if (html.indexOf(file) === -1) {
    throw new Error('index.html does not reference ' + file + ' - aborting, nothing written');
  }
}
if (html.length < 4000) {
  throw new Error('index.html came out at ' + html.length + ' bytes - aborting, nothing written');
}

writeFileSync(INDEX, html);
writeFileSync(MANIFEST, JSON.stringify({
  at: new Date().toISOString(),
  files: written.length,
  css: cssFiles.length,
  data: scripts[0][2].length,
  scripts: Object.fromEntries(scripts.slice(1).map(function (s) { return [s[1], s[2].length]; }))
}, null, 2) + '\n');

console.log('Wrote ' + written.length + ' parts: ' + cssFiles.length + ' CSS, ' +
  scripts.slice(1).map(function (s) { return s[2].length + ' ' + s[0]; }).join(', ') +
  ', ' + scripts[0][2].length + ' data. index.html is ' + html.split('\n').length + ' lines.');
