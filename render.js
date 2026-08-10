'use strict';
/*
 * render.js — CLI wrapper around src/renderer.js.
 *   node render.js                    -> dist/magnus-carlsen.mp4
 *   node render.js --edit=immortal    -> dist/immortal-game.mp4
 *   node render.js --keyframes        -> also dump PNG stills to dist/keyframes-<id>/
 *   node render.js --out=foo.mp4      -> custom output path
 */
// renders need periodic GC to stay within RAM (see src/renderer.js)
if (typeof global.gc !== 'function') {
  const r = require('child_process').spawnSync(
    process.execPath, ['--expose-gc', __filename, ...process.argv.slice(2)], { stdio: 'inherit' });
  process.exit(r.status == null ? 1 : r.status);
}
const { renderEdit } = require('./src/renderer.js');

function arg(name, def) {
  const hit = process.argv.find((a) => a.startsWith('--' + name));
  if (!hit) return def;
  const eq = hit.indexOf('=');
  return eq === -1 ? true : hit.slice(eq + 1);
}

renderEdit(arg('edit', 'magnus'), { outPath: arg('out', undefined), keyframes: !!arg('keyframes', false) })
  .catch((e) => { console.error('RENDER FAIL:', e); process.exit(1); });
