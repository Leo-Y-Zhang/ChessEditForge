'use strict';
/*
 * tools/render_missing.js — self-healing catalogue renderer. Finds every edit
 * whose Day-folder MP4 is missing or stale (wrong resolution/duration),
 * renders them ONE at a time in a fresh node process (see CLAUDE.md render
 * law), and exits 0 when the catalogue is complete. Idempotent: safe to
 * relaunch after any interruption (sleep, kill, reboot) — it only redoes
 * what is actually incomplete.
 *
 * While rendering it holds ES_SYSTEM_REQUIRED via a PowerShell child so an
 * idle machine does not doze off mid-render (does NOT survive a closed lid —
 * nothing user-level does).
 *
 *   node tools/render_missing.js
 */
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const EDITS = require('../src/edits.js');
const storygen = require('../src/storygen.js');

const OUT = process.env.CHESS_EDITS_DIR || path.join(require('os').homedir(), 'iCloudDrive', 'Chess Edits');
const SCALE = Number(process.env.CHESS_RENDER_SCALE) || 4 / 3;
const EXPECT_W = Math.round((1080 * SCALE) / 2) * 2;
const EXPECT_H = Math.round((1920 * SCALE) / 2) * 2;
const REPO = path.join(__dirname, '..');

function planFolders() {
  const perCat = {};
  const rows = [];
  for (const id of Object.keys(EDITS)) {
    const e = EDITS[id];
    const cat = e.category || 'Games';
    perCat[cat] = (perCat[cat] || 0) + 1;
    rows.push({ id, e, folder: path.join(OUT, cat, `Day ${String(perCat[cat]).padStart(2, '0')} — ${e.title}`) });
  }
  return rows;
}

function isComplete(row) {
  const file = path.join(row.folder, row.e.out);
  if (!fs.existsSync(file)) return false;
  let buf;
  try { buf = fs.readFileSync(file); } catch { return false; }
  const boxes = new Set();
  let o = 0;
  while (o + 8 <= buf.length) {
    const size = buf.readUInt32BE(o);
    boxes.add(buf.toString('latin1', o + 4, o + 8));
    if (size < 8) break;
    o += size;
  }
  if (!boxes.has('ftyp') || !boxes.has('moov') || !boxes.has('mdat')) return false;
  const avc1 = buf.indexOf('avc1');
  if (avc1 === -1) return false;
  if (buf.readUInt16BE(avc1 + 4 + 24) !== EXPECT_W || buf.readUInt16BE(avc1 + 4 + 26) !== EXPECT_H) return false;
  const mvhd = buf.indexOf('mvhd');
  if (mvhd === -1 || buf[mvhd + 4] !== 0) return false;
  const dur = buf.readUInt32BE(mvhd + 20) / buf.readUInt32BE(mvhd + 16);
  const expect = storygen.makeStoryboard(row.e.def).cfg.duration;
  return Math.abs(dur - expect) <= 0.5;
}

function keepAwake() {
  try {
    const ps = spawn('powershell', ['-NoProfile', '-Command',
      "Add-Type -Name P -Namespace W -MemberDefinition '[DllImport(\"kernel32.dll\")] public static extern uint SetThreadExecutionState(uint f);'; [W.P]::SetThreadExecutionState(0x80000001); while($true){Start-Sleep -Seconds 30}",
    ], { stdio: 'ignore' });
    return ps;
  } catch { return null; }
}

const rows = planFolders();
const todo = rows.filter((r) => !isComplete(r));
if (!todo.length) { console.log('CATALOGUE COMPLETE — nothing to render'); process.exit(0); }
console.log('incomplete: ' + todo.map((r) => r.id).join(' '));

const ka = keepAwake();
let failed = 0;
for (const r of todo) {
  let ok = false;
  for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
    const res = spawnSync(process.execPath, ['rerender.js', r.id], { cwd: REPO, stdio: 'inherit' });
    ok = res.status === 0;
    if (!ok) console.log(`RETRY ${r.id} (attempt ${attempt} exit ${res.status})`);
  }
  if (!ok) { failed++; console.log('GAVEUP ' + r.id); }
}
if (ka) ka.kill();
console.log(failed ? `DONE WITH ${failed} FAILURES` : 'ALL RENDERED');
process.exit(failed ? 1 : 0);
