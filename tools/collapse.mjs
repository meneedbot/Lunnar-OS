// Puts the OS back to its eight files: restores index.html's two tags
// (css/os.css and js/data.js), removes css/parts and js/parts, and removes the
// modularizer. Safe to run repeatedly, and it refuses to write index.html unless
// both tags come back.
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';

const INDEX = 'index.html';
let html = readFileSync(INDEX, 'utf8');

if (html.indexOf('css/parts/') === -1 && html.indexOf('js/parts/') === -1) {
  console.log('index.html is already unsplit.');
} else {
  const lines = html.split('\n');
  const out = [];
  let css = 0;
  let data = 0;

  for (const line of lines) {
    const t = line.trim();
    if (t.indexOf('<link rel="stylesheet" href="css/parts/') === 0) {
      if (!css) out.push('<link rel="stylesheet" href="css/os.css">');
      css++;
      continue;
    }
    if (t.indexOf('<script src="js/parts/data/') === 0 && /<\/script>$/.test(t)) {
      if (!data) out.push('<script src="js/data.js"></script>');
      data++;
      continue;
    }
    out.push(line);
  }

  html = out.join('\n');

  if (html.indexOf('href="css/os.css"') === -1 || html.indexOf('src="js/data.js"') === -1) {
    throw new Error('the two tags did not come back - aborting, nothing written');
  }

  writeFileSync(INDEX, html);
  console.log('Restored index.html from ' + css + ' CSS parts and ' + data + ' data parts.');
}

for (const dir of ['css/parts', 'js/parts']) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
    console.log('Removed ' + dir + '/.');
  }
}

for (const file of ['tools/modularize.mjs', 'tools/modularized.json']) {
  if (existsSync(file)) {
    rmSync(file, { force: true });
    console.log('Removed ' + file + '.');
  }
}
