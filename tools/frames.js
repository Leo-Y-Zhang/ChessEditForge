'use strict';
/*
 * tools/frames.js — render a few still PNG frames of an edit, for a quick visual check
 * without encoding a video:  node tools/frames.js <editId> [outDir] [scale]
 * Frames: the board reveal, mid-montage, the tension push, the drop and the finish.
 */
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');
const chess = require('../src/chess.js');
const scene = require('../src/scene.js');
const fxMod = require('../src/fx.js');
const brand = require('../src/brand.js');
const storygen = require('../src/storygen.js');
const EDITS = require('../src/edits.js');

const [editId, outDir = 'dist/frames', scaleArg] = process.argv.slice(2);
const edit = EDITS[editId];
if (!edit) { console.error('unknown edit: ' + editId); process.exit(1); }
const theme = require('../src/' + edit.theme + '.js');
const game = require('../src/' + edit.game + '.js');
const story = storygen.makeStoryboard(edit.def);
const { positions, moves } = chess.replay(game.san);
const noise = fxMod.makeNoise((w, h) => createCanvas(w, h), 256);
const deps = { theme, story, positions, moves, noise, brand };
const S = Number(scaleArg) || 0.5;
const canvas = createCanvas(Math.round(theme.W * S), Math.round(theme.H * S));
const ctx = canvas.getContext('2d');
const c = story.cfg;
const shots = {
  reveal: c.boardFadeEnd + 0.4,
  montage: (c.flurryStart + c.flurryEnd) / 2,
  tension: c.tensionStart + 1.0,
  drop: c.dropAt + c.dropDur * 0.5,
  finish: c.dropAt + c.dropDur + 0.6,
};
fs.mkdirSync(outDir, { recursive: true });
for (const [name, t] of Object.entries(shots)) {
  ctx.setTransform(S, 0, 0, S, 0, 0);
  scene.drawFrame(ctx, t, deps);
  const file = path.join(outDir, `${editId}-${name}.png`);
  fs.writeFileSync(file, canvas.toBuffer('image/png'));
  console.log(file, 't=' + t.toFixed(2));
}
