'use strict';
/*
 * tools/probe.js — completeness gate for the rendered catalogue. For every
 * edit it checks the Day folder holds a real, complete MP4: ftyp+moov+mdat
 * boxes, the expected scaled avc1 stream (1080x1920 x RENDER_SCALE, i.e.
 * 1440x2560 by default), a duration matching the storyboard within 0.5s,
 * no audio track (silent by design), and the caption.txt / sound.txt
 * sidecars. Exit code 1 if anything fails.
 *
 *   node tools/probe.js
 */
const fs = require('fs');
const path = require('path');
const EDITS = require('../src/edits.js');
const storygen = require('../src/storygen.js');

const OUT = process.env.CHESS_EDITS_DIR || path.join(require('os').homedir(), 'iCloudDrive', 'Chess Edits');
// expected output resolution = logical 1080x1920 x the render scale (see renderer.js)
const SCALE = Number(process.env.CHESS_RENDER_SCALE) || 4 / 3;
const EXPECT_W = Math.round((1080 * SCALE) / 2) * 2;
const EXPECT_H = Math.round((1920 * SCALE) / 2) * 2;

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

function probeMp4(file) {
  const buf = fs.readFileSync(file);
  const boxes = {};
  let o = 0;
  while (o + 8 <= buf.length) {
    const size = buf.readUInt32BE(o);
    const type = buf.toString('latin1', o + 4, o + 8);
    boxes[type] = { at: o, size };
    if (size < 8) break;
    o += size;
  }
  const out = { bytes: buf.length, boxes: Object.keys(boxes) };
  const mvhd = buf.indexOf('mvhd');
  if (mvhd !== -1 && buf[mvhd + 4] === 0) {
    const timescale = buf.readUInt32BE(mvhd + 16);
    const duration = buf.readUInt32BE(mvhd + 20);
    out.duration = duration / timescale;
    out.created = buf.readUInt32BE(mvhd + 8); // must be 0 (scrubbed)
  }
  const avc1 = buf.indexOf('avc1');
  if (avc1 !== -1) {
    out.width = buf.readUInt16BE(avc1 + 4 + 24);
    out.height = buf.readUInt16BE(avc1 + 4 + 26);
  }
  out.hasAudioTrack = buf.indexOf('soun') !== -1;
  return out;
}

let fail = 0;
const rows = planFolders();
for (const r of rows) {
  const problems = [];
  const mp4 = path.join(r.folder, r.e.out);
  if (!fs.existsSync(mp4)) {
    problems.push('missing mp4');
  } else {
    const p = probeMp4(mp4);
    const expect = storygen.makeStoryboard(r.e.def).cfg.duration;
    if (!p.boxes.includes('ftyp') || !p.boxes.includes('moov') || !p.boxes.includes('mdat')) {
      problems.push('incomplete box structure: ' + p.boxes.join(','));
    }
    if (p.width !== EXPECT_W || p.height !== EXPECT_H) problems.push(`resolution ${p.width}x${p.height} != ${EXPECT_W}x${EXPECT_H}`);
    if (!(Math.abs(p.duration - expect) <= 0.5)) problems.push(`duration ${p.duration}s != ${expect}s`);
    if (p.hasAudioTrack) problems.push('has an audio track (should be silent)');
    if (p.created !== 0) problems.push('creation timestamp not scrubbed');
    if (p.bytes < 500 * 1024) problems.push(`suspiciously small (${p.bytes} bytes)`);
  }
  for (const f of ['caption.txt', 'sound.txt']) {
    if (!fs.existsSync(path.join(r.folder, f))) problems.push('missing ' + f);
  }
  const sound = path.join(r.folder, 'sound.txt');
  if (fs.existsSync(sound)) {
    const s = fs.readFileSync(sound, 'utf8');
    for (const k of ['Vibe:', 'Sound:', 'Paste:', 'Backup:', 'Sync:']) {
      if (!s.includes(k)) problems.push('sound.txt missing ' + k);
    }
    if (/search tiktok/i.test(s)) problems.push('sound.txt has generic phrasing');
  }
  if (problems.length) { fail++; console.log('FAIL ' + r.id + ': ' + problems.join('; ')); }
  else console.log('ok   ' + r.id);
}
console.log(fail ? `\n${fail}/${rows.length} FAILED` : `\nALL ${rows.length} COMPLETE`);
process.exit(fail ? 1 : 0);
