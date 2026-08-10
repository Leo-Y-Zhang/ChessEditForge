'use strict';
/* MP4-only re-render to existing Day folders (no caption/sound/INDEX writes).
 * RUN ONE AT A TIME: a single 1440p render parks ~10GB RSS; two in parallel
 * get OS-killed (see CLAUDE.md render law).
 * Usage: node rerender.js <id> [<id> ...] */
// renders churn one big pixel buffer per frame; without --expose-gc the process
// balloons to ~10GB and the OS may kill it, so re-exec with the flag if needed
if (typeof global.gc !== 'function') {
  const r = require('child_process').spawnSync(
    process.execPath, ['--expose-gc', __filename, ...process.argv.slice(2)], { stdio: 'inherit' });
  process.exit(r.status == null ? 1 : r.status);
}
const path = require('path');
const { renderEdit, EDITS } = require('./src/renderer.js');
const OUT = process.env.CHESS_EDITS_DIR || path.join(require('os').homedir(), 'iCloudDrive', 'Chess Edits');

function folderFor(id) {
  const perCat = {};
  for (const k of Object.keys(EDITS)) {
    const e = EDITS[k];
    const cat = e.category || 'Games';
    perCat[cat] = (perCat[cat] || 0) + 1;
    if (k === id) return path.join(OUT, cat, `Day ${String(perCat[cat]).padStart(2, '0')} — ${e.title}`);
  }
  throw new Error('unknown edit ' + id);
}

async function main() {
  for (const id of process.argv.slice(2)) {
    const e = EDITS[id];
    const outPath = path.join(folderFor(id), e.out);
    await renderEdit(id, { outPath, progress: false });
    console.log('OK ' + id + ' -> ' + outPath);
  }
}
main().catch((e) => { console.error('FAIL', e); process.exit(1); });
