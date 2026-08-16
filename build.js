'use strict';
/*
 * build.js — inlines every module into a single, self-contained HTML file that
 * runs from file:// with no server, no external requests.
 * Output: dist/<edit>.html per the edit's `html` field (chess-edit.html for
 * the default magnus edit).
 */
const fs = require('fs');
const path = require('path');
const EDITS = require('./src/edits.js');
const storygenMod = require('./src/storygen.js');

function arg(name, def) {
  const hit = process.argv.find((a) => a.startsWith('--' + name));
  if (!hit) return def;
  const eq = hit.indexOf('=');
  return eq === -1 ? true : hit.slice(eq + 1);
}
const editId = arg('edit', 'magnus');
const edit = EDITS[editId];
if (!edit) { console.error('unknown edit:', editId, '- known:', Object.keys(EDITS).join(', ')); process.exit(1); }

// dependency order — each accesses the others through window.CEF.
// The theme/game files swap per edit; the storyboard is built at runtime by
// storygen from the injected edit definition (CEF.def).
const MODULES = [
  edit.theme, 'engine', 'chess', edit.game, 'pieces',
  'board', 'captions', 'fx', 'brand', 'storygen', 'scene', 'browser',
];

// inject the edit definition so the browser can build the storyboard via storygen
const defScript = `\n/* ---- edit definition ---- */\n;(function(){var g=(typeof window!=='undefined'?window:globalThis);g.CEF=g.CEF||{};g.CEF.def=${JSON.stringify(edit.def)};g.CEF.editSlug=${JSON.stringify(path.basename(edit.out, '.mp4'))};})();\n`;

const js = defScript + MODULES.map((m) => {
  const code = fs.readFileSync(path.join('src', m + '.js'), 'utf8');
  // Wrap each module so its top-level `const API` etc. can't collide in the
  // browser's shared global scope. Inter-module access goes via window.CEF.
  return `\n/* ---- ${m}.js ---- */\n;(function(){\n${code}\n})();\n`;
}).join('');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${edit.title}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #05070b; color: #e9edf2;
         font-family: Bahnschrift, "Segoe UI", system-ui, sans-serif;
         display: flex; flex-direction: column; align-items: center;
         min-height: 100vh; padding: 16px; gap: 14px; }
  h1 { font-family: Impact, "Arial Black", sans-serif; font-weight: 400;
       letter-spacing: 1px; font-size: 22px; margin: 4px 0 0; color: #e8b64a; }
  canvas { height: min(82vh, 900px); aspect-ratio: 9 / 16; width: auto;
           border-radius: 14px; box-shadow: 0 20px 60px rgba(0,0,0,.6);
           background: #05070b; }
  .bar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: center; }
  button { font: 600 16px Bahnschrift, "Segoe UI", sans-serif; color: #06121c;
           background: #e8b64a; border: 0; border-radius: 10px; padding: 12px 20px;
           cursor: pointer; transition: transform .08s ease, filter .12s ease; }
  button:hover { filter: brightness(1.08); } button:active { transform: translateY(1px); }
  button:disabled { opacity: .5; cursor: default; }
  button.ghost { background: transparent; color: #e9edf2; border: 1px solid #33404d; }
  #status { min-height: 20px; font-size: 13px; color: #93a2b3; text-align: center; max-width: 640px; }
  .hint { font-size: 12px; color: #63707e; max-width: 640px; text-align: center; line-height: 1.5; }
</style>
</head>
<body>
  <h1>${edit.title}</h1>
  <canvas id="stage" width="1080" height="1920"></canvas>
  <div class="bar">
    <button id="replay" class="ghost">▶ Replay</button>
    <button id="export">⭳ Export video</button>
  </div>
  <div id="status">loading…</div>
  <div class="hint">Silent by design — post it to TikTok and add a trending sound; the beat-drop lands at ~${storygenMod.makeStoryboard(edit.def).cfg.dropAt.toFixed(0)}s.
    Best exported in Chrome/Edge for a true .mp4. Everything runs on your device; nothing is uploaded.</div>
<script>
${js}
</script>
</body>
</html>
`;

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync(path.join('dist', edit.html), html);
console.log('OK  dist/' + edit.html + '  (' + (html.length / 1024).toFixed(0) + ' KB, self-contained)');
