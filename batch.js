'use strict';
/*
 * batch.js — render the catalogue into the iCloud "Chess Edits" folder, organised
 * as:  Chess Edits / <Category> / Day NN — <Title> /  { <edit>.mp4, caption.txt, sound.txt }
 * so every post is a self-contained folder. Also writes a master INDEX.md.
 *
 *   node batch.js                 -> render every edit
 *   node batch.js opera reti      -> render just those (into their day folders)
 */
// renders need periodic GC to stay within RAM (see src/renderer.js)
if (typeof global.gc !== 'function') {
  const r = require('child_process').spawnSync(
    process.execPath, ['--expose-gc', __filename, ...process.argv.slice(2)], { stdio: 'inherit' });
  process.exit(r.status == null ? 1 : r.status);
}
const fs = require('fs');
const path = require('path');
const { renderEdit, EDITS } = require('./src/renderer.js');
const BRAND = require('./src/brand.js');

const OUT = process.env.CHESS_EDITS_DIR || path.join(require('os').homedir(), 'iCloudDrive', 'Chess Edits');

// stable day-ordering = order in edits.js, grouped by category
function plan() {
  const ids = Object.keys(EDITS);
  const perCat = {};
  const rows = [];
  for (const id of ids) {
    const e = EDITS[id];
    const cat = e.category || 'Games';
    perCat[cat] = (perCat[cat] || 0) + 1;
    const day = perCat[cat];
    const folder = path.join(OUT, cat, `Day ${String(day).padStart(2, '0')} — ${e.title}`);
    rows.push({ id, e, cat, day, folder });
  }
  return rows;
}

// ensure the high-reach core tags are present (deduped) without touching the
// edit-specific ones already in the caption
function optimizeCaption(cap) {
  const core = ['#chess', '#chesstok', '#chessedit', '#chesstiktok'];
  const have = new Set((cap.match(/#[\w]+/g) || []).map((s) => s.toLowerCase()));
  const add = core.filter((t) => !have.has(t.toLowerCase()));
  return cap + (add.length ? ' ' + add.join(' ') : '');
}

// sound.txt: the vibe, the exact sound, a "Paste:" line to copy straight into
// TikTok's sound search, the backup with its own paste line, and where to line
// the drop up — specific and focused, nothing generic.
function soundText(a) {
  return [
    'Vibe:   ' + a.vibe,
    'Sound:  ' + a.sound,
    'Paste:  ' + a.search,
    'Backup: ' + a.backup,
    'Paste:  ' + a.backupSearch,
    'Sync:   ' + a.sync,
  ].join('\n') + '\n';
}

function writeMeta(row) {
  fs.mkdirSync(row.folder, { recursive: true });
  fs.writeFileSync(path.join(row.folder, 'caption.txt'), optimizeCaption(row.e.caption) + '\n');
  fs.writeFileSync(path.join(row.folder, 'sound.txt'), soundText(row.e.audio));
}

function writeIndex(rows) {
  let md = `# Chess Edits — posting plan\n\n_${BRAND.name} (${BRAND.handle}). Each folder below is one ready-to-post video: the .mp4, its caption.txt, and sound.txt._\n\n`;
  let cat = '';
  for (const r of rows) {
    if (r.cat !== cat) { cat = r.cat; md += `\n## ${cat}\n\n`; }
    md += `- **Day ${String(r.day).padStart(2, '0')} — ${r.e.title}** · \`${r.e.out}\` · ♪ ${r.e.audio.sound}\n`;
  }
  fs.writeFileSync(path.join(OUT, 'INDEX.md'), md);
}

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const rows = plan();
  fs.mkdirSync(OUT, { recursive: true });
  const t0 = Date.now();
  for (const r of rows) {
    writeMeta(r);
    if (only.length && !only.includes(r.id)) continue;
    const outPath = path.join(r.folder, r.e.out);
    console.log('=== ' + r.cat + ' / Day ' + r.day + ' — ' + r.id);
    await renderEdit(r.id, { outPath });
  }
  writeIndex(rows);
  console.log(`\nDONE in ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${OUT}`);
}

main().catch((e) => { console.error('BATCH FAIL:', e); process.exit(1); });
