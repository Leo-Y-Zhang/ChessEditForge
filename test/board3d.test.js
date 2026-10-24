'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const board = require('../src/board.js');
const scene = require('../src/scene.js');
const storygen = require('../src/storygen.js');
const theme = require('../src/theme.js');
const EDITS = require('../src/edits.js');

const lo = board.layout(theme);
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} vs ${b}`);

// The 3D-style board: squares projected through a pinhole camera tilted about the board's middle.
test('tilt 0 projects every point to itself (the classic flat board)', () => {
  for (const [x, y] of [[lo.bx, lo.by], [lo.bx + lo.size, lo.by + lo.size], [lo.bx + 123, lo.by + 456]]) {
    const q = board.project(lo, 0, x, y);
    near(q.x, x, 'x'); near(q.y, y, 'y'); near(q.s, 1, 'scale');
  }
});

test('the near edge keeps its flat width and position at any tilt', () => {
  for (const tilt of [0.3, 0.5, 0.82]) {
    const l = board.project(lo, tilt, lo.bx, lo.by + lo.size);
    const r = board.project(lo, tilt, lo.bx + lo.size, lo.by + lo.size);
    near(l.x, lo.bx, `left x at ${tilt}`); near(r.x, lo.bx + lo.size, `right x at ${tilt}`);
    near(l.y, lo.by + lo.size, `near y at ${tilt}`); near(l.s, 1, `near scale at ${tilt}`);
  }
});

test('far ranks recede: narrower, higher, and smaller the more the board tilts', () => {
  const farWidth = tilt => {
    const l = board.project(lo, tilt, lo.bx, lo.by), r = board.project(lo, tilt, lo.bx + lo.size, lo.by);
    return r.x - l.x;
  };
  assert.ok(farWidth(0.5) < lo.size, 'far edge narrower than the near edge');
  assert.ok(farWidth(0.82) < farWidth(0.5), 'a lower camera angle narrows it further');
  let prev = null;
  for (let rank = 0; rank <= 8; rank++) {   // walk from the far edge (rank 8) to the near edge
    const q = board.project(lo, 0.6, lo.bx + lo.size / 2, lo.by + rank * lo.cs);
    if (prev) {
      assert.ok(q.y > prev.y, 'nearer ranks sit lower on screen');
      assert.ok(q.s > prev.s, 'nearer ranks are drawn bigger');
    }
    prev = q;
  }
  const top = board.project(lo, 0.6, lo.bx, lo.by);
  assert.ok(top.y > lo.by, 'the far edge drops toward the viewer: the board looks flatter');
});

test('the camera angle sweeps down at the reveal, and def.tilt3d = false keeps the flat board', () => {
  const def = EDITS.immortal.def;
  const cfg = storygen.makeStoryboard(def).cfg;
  const start = scene.computeCamera(cfg.boardFadeStart, cfg, theme).tilt;
  const settled = scene.computeCamera(cfg.boardFadeEnd + 1.3, cfg, theme).tilt;
  assert.ok(start > settled && settled > 0, `reveal sweeps from ${start} down to ${settled}`);
  for (const t of [cfg.boardFadeEnd, cfg.tensionStart + 1, cfg.dropAt, cfg.dropAt + cfg.dropDur + 1]) {
    const tilt = scene.computeCamera(t, cfg, theme).tilt;
    assert.ok(tilt > 0 && tilt < Math.PI / 2, `tilt ${tilt} at t=${t} stays a sensible angle`);
  }
  const flat = storygen.makeStoryboard(Object.assign({}, def, { tilt3d: false })).cfg;
  assert.equal(flat.tilt3d, null);
  assert.equal(scene.computeCamera(cfg.dropAt, flat, theme).tilt, 0);
});
