'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../src/engine.js');
const { makeStoryboard } = require('../src/storygen.js');
const script = require('../src/script.js');

test('captions are absent outside their interval and at zero-opacity endpoints', () => {
  const cap = { text: 'test', start: 1, end: 3, inDur: 0.5, outDur: 0.5 };
  for (const t of [0, 1, 3, 4]) assert.deepEqual(engine.activeCaptions([cap], t), [], String(t));
  const [live] = engine.activeCaptions([cap], 1.25);
  assert.equal(live.cap, cap);
  assert.equal(live.opacity, 0.5);
  assert.equal(live.enter, 0.5);
  assert.equal(live.exit, 0);
});

test('weighted montage switches at the exact boundary and glides before holding', () => {
  const cfg = {
    montageGlide: 0.5,
    flurrySchedule: [{ ply: 4, start: 2, end: 3 }, { ply: 5, start: 3, end: 5 }],
  };
  assert.deepEqual(engine.plyAt(cfg, 0), { ply: 4, progress: 0, slotFrac: 0 });
  assert.equal(engine.plyAt(cfg, 3 - 1e-6).ply, 4);
  assert.deepEqual(engine.plyAt(cfg, 3), { ply: 5, progress: 0, slotFrac: 0 });
  assert.deepEqual(engine.plyAt(cfg, 3.5), { ply: 5, progress: 0.5, slotFrac: 0.25 });
  assert.deepEqual(engine.plyAt(cfg, 4), { ply: 5, progress: 1, slotFrac: 0.5 });
  assert.deepEqual(engine.plyAt(cfg, 6), { ply: 5, progress: 1, slotFrac: 1 });
});

function definition(badges) {
  return {
    duration: 18, intro: { mode: 'concept', line1: 'A test' },
    montage: { fromPly: 0, toPly: 1 },
    drop: { fromPly: 5, toPly: 6, line: 'Finish.' },
    outro: { title: 'Test' }, badges,
  };
}

test('badges can start at zero or on either boundary ply of a bridge', () => {
  const { cfg } = makeStoryboard(definition([
    { at: 0, ply: 0, sq: 'e4', type: '!!' },
    { ply: 2, sq: 'e5', type: '!!' }, { ply: 4, sq: 'f3', type: '!!' },
  ]));
  assert.equal(cfg.badges[0].at, 0);
  assert.equal(cfg.bridgeFromPly, 2);
  assert.equal(cfg.bridgeToPly, 4);
  const round = (x) => Math.round(x * 100) / 100;
  const span = cfg.bridgeEnd - cfg.bridgeStart;
  assert.equal(cfg.badges[1].at, round(cfg.bridgeStart + 0.72 / 3 * span));
  assert.equal(cfg.badges[2].at, round(cfg.bridgeStart + 2.72 / 3 * span));
});

test('FINAL cut marks the last move landing rather than the beginning of its slot', () => {
  const edit = { def: definition([]), audio: { sync: 'DROP' } };
  const { cfg } = makeStoryboard(edit.def);
  const final = script.cuts(edit).find((c) => c.kind === 'FINAL');
  const last = cfg.dropSchedule.at(-1);
  assert.ok(final.at > last.start && final.at < last.end);
  assert.equal(final.at, Math.round((last.start + 0.55 * (last.end - last.start)) * 100) / 100);
});

test('a bridge that starts at time zero still gets its BRIDGE cut', () => {
  // `bridgeStart != null`, not truthiness: 0 is a real start time.
  const storygen = require('../src/storygen.js');
  const real = storygen.makeStoryboard;
  storygen.makeStoryboard = (def) => {
    const board = real(def);
    board.cfg.bridgeStart = 0;
    return board;
  };
  try {
    const edit = { def: definition([]), audio: { sync: 'DROP' } };
    assert.deepEqual(script.cuts(edit).filter((c) => c.kind === 'BRIDGE').map((c) => c.at), [0]);
  } finally {
    storygen.makeStoryboard = real;
  }
});
