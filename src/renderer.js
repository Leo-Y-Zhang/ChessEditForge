'use strict';
/*
 * renderer.js — reusable core: render one edit to an H.264 .mp4 entirely
 * in-process (headless canvas + wasm encoder). Used by render.js (CLI) and
 * batch.js (renders the whole catalogue to a folder).
 */
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');
const HME = require('h264-mp4-encoder');

const chess = require('./chess.js');
const scene = require('./scene.js');
const fxMod = require('./fx.js');
const brand = require('./brand.js');
const storygen = require('./storygen.js');
const EDITS = require('./edits.js');
const fonts = require('./fonts.js');

// Zero the creation/modification timestamps inside the moov box so the exported
// file carries NO metadata about when/where it was made. Confined to moov (never
// touches the mdat video payload) to avoid corrupting the stream.
function scrubMp4(buf) {
  // find the top-level moov box
  let o = 0, moovStart = -1, moovEnd = buf.length;
  while (o + 8 <= buf.length) {
    const size = buf.readUInt32BE(o);
    const type = buf.toString('latin1', o + 4, o + 8);
    if (type === 'moov') { moovStart = o + 8; moovEnd = size > 1 ? o + size : buf.length; break; }
    if (size < 8) break;
    o += size;
  }
  if (moovStart < 0) return buf;
  for (const tag of ['mvhd', 'tkhd', 'mdhd']) {
    let i = moovStart;
    while ((i = buf.indexOf(tag, i)) !== -1 && i < moovEnd) {
      const ver = buf[i + 4];
      if (ver === 0) { buf.writeUInt32BE(0, i + 8); buf.writeUInt32BE(0, i + 12); }
      else if (ver === 1) { buf.writeUInt32BE(0, i + 8); buf.writeUInt32BE(0, i + 12); buf.writeUInt32BE(0, i + 16); buf.writeUInt32BE(0, i + 20); }
      i += 4;
    }
  }
  return buf;
}

// Output resolution = theme layout (1080x1920) x RENDER_SCALE. The whole frame
// is vector-drawn, so upscaling the canvas transform yields true extra detail
// (not an upscale blur). 4/3 -> 1440x2560 ("2K vertical").
const RENDER_SCALE = Number(process.env.CHESS_RENDER_SCALE) || 4 / 3;

async function renderEdit(editId, opts) {
  opts = opts || {};
  const edit = EDITS[editId];
  if (!edit) throw new Error('unknown edit: ' + editId + ' (known: ' + Object.keys(EDITS).join(', ') + ')');
  const theme = require('./' + edit.theme + '.js');
  // Say so before spending minutes on frames that will not look like the
  // catalogue. One check here covers render.js, batch.js and rerender.js.
  fonts.warnIfMissing(theme, editId);
  const game = require('./' + edit.game + '.js');
  const story = storygen.makeStoryboard(edit.def);

  const outPath = opts.outPath || ('dist/' + edit.out);
  const keyframes = !!opts.keyframes;
  const W = theme.W, H = theme.H, fps = theme.fps;
  const S = opts.scale || RENDER_SCALE;
  const CW = Math.round((W * S) / 2) * 2, CH = Math.round((H * S) / 2) * 2; // H.264 needs even dims
  const dur = story.cfg.duration != null ? story.cfg.duration : theme.duration;
  const frames = Math.round(dur * fps);

  const { positions, moves } = chess.replay(game.san);
  const noise = fxMod.makeNoise((w, h) => createCanvas(w, h), 256);
  const deps = { theme, story, positions, moves, noise, brand };

  const canvas = createCanvas(CW, CH);
  const ctx = canvas.getContext('2d');

  const enc = await HME.createH264MP4Encoder();
  enc.width = CW; enc.height = CH; enc.frameRate = fps;
  enc.quantizationParameter = 16;   // lower QP = cleaner gradients + motion
  enc.groupOfPictures = fps;        // 1s keyframe interval
  enc.initialize();

  const kfDir = 'dist/keyframes-' + editId;
  if (keyframes && !fs.existsSync(kfDir)) fs.mkdirSync(kfDir, { recursive: true });
  const c = story.cfg;
  const kfTimes = [
    1.0, c.boardFadeEnd + 0.2, (c.flurryStart + c.flurryEnd) / 2, c.flurryEnd - 0.2,
    ...(c.bridgeStart != null ? [(c.bridgeStart + c.bridgeEnd) / 2] : []),
    c.tensionStart + 1.0, c.dropAt - 0.1, c.dropAt + c.dropDur * 0.5,
    c.dropAt + c.dropDur + 0.5, c.outroStart + 0.9, c.fadeStart - 0.3,
  ].map((x) => Math.round(x * 100) / 100);
  let kfIdx = 0;

  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    const t = f / fps;
    // all drawing code works in the 1080x1920 logical space; the transform
    // maps it onto the (possibly larger) real canvas
    ctx.setTransform(S, 0, 0, S, 0, 0);
    scene.drawFrame(ctx, t, deps);
    const img = ctx.getImageData(0, 0, CW, CH);
    enc.addFrameRgba(img.data);
    // each frame leaves an ~CWxCHx4 buffer behind; without frequent GC the
    // process balloons to many GB and risks an OS kill (run via --expose-gc)
    if (global.gc && f % 24 === 0) global.gc();
    if (keyframes && kfIdx < kfTimes.length && t >= kfTimes[kfIdx]) {
      fs.writeFileSync(path.join(kfDir, `t${kfTimes[kfIdx].toFixed(2)}.png`),
        Buffer.from(canvas.toBuffer('image/png')));
      kfIdx++;
    }
    if (opts.progress !== false && f % 60 === 0) {
      const rss = (process.memoryUsage().rss / 1e9).toFixed(1);
      process.stdout.write(`\r  frame ${f}/${frames} (rss ${rss}G)`);
    }
  }
  enc.finalize();
  const out = scrubMp4(Buffer.from(enc.FS.readFile(enc.outputFilename)));
  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  fs.writeFileSync(outPath, out);
  enc.delete();

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const bytes = fs.statSync(outPath).size;
  if (opts.progress !== false) {
    process.stdout.write(`\r  frame ${frames}/${frames}\n`);
    console.log(`OK  ${outPath}  (${(bytes / 1024).toFixed(0)} KB, ${frames} frames, ${secs}s)`);
  }
  return { outPath, frames, bytes, seconds: Number(secs), durationSec: dur };
}

module.exports = { renderEdit, EDITS };
