'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const chess = require('../src/chess.js');
const scene = require('../src/scene.js');
const storygen = require('../src/storygen.js');
const theme = require('../src/theme.js');
const EDITS = require('../src/edits.js');

function build(id) {
  const e = EDITS[id];
  const game = require('../src/' + e.game + '.js');
  const { positions, moves } = chess.replay(game.san);
  const cfg = storygen.makeStoryboard(e.def).cfg;
  return { cfg, positions, moves };
}

// The end-of-edit animation: a checkmate topples the mated king (violent),
// a resignation topples the LOSING king (soft) and dims to a spotlight.
test('checkmate edit topples the mated king with rising progress', () => {
  const { cfg, positions, moves } = build('magnus'); // ends in mate, mateKingSq set
  const start = cfg.dropAt + cfg.dropDur;
  const early = scene.computeBoardState(start + 0.02, cfg, positions, moves, theme);
  const mid = scene.computeBoardState(start + 0.3, cfg, positions, moves, theme);
  const late = scene.computeBoardState(start + 2.0, cfg, positions, moves, theme);
  assert.ok(early.endAnim, 'endAnim present after the drop lands');
  assert.equal(early.endAnim.kind, 'mate');
  assert.equal(early.endAnim.sq, cfg.mateKingSq, 'targets the mated king square');
  assert.ok(mid.endAnim.progress > early.endAnim.progress, 'progress rises');
  assert.equal(late.endAnim.progress, 1, 'reaches 1');
});

test('resign edit topples the auto-detected LOSING king', () => {
  const { cfg, positions, moves } = build('goldcoins'); // ends in resignation
  const start = cfg.dropAt + cfg.dropDur;
  const bs = scene.computeBoardState(start + 0.5, cfg, positions, moves, theme);
  assert.ok(bs.endAnim, 'endAnim present');
  assert.equal(bs.endAnim.kind, 'resign');
  // independently compute the expected losing-king square
  const dropTo = cfg.dropToPly;
  const winner = moves[dropTo].side;
  const loserKing = winner === 'w' ? 'k' : 'K';
  const finalPos = positions[dropTo];
  let expectSq = null;
  for (let i = 0; i < 64; i++) if (finalPos[i] === loserKing) expectSq = chess.name(i);
  assert.ok(expectSq, 'a losing king exists');
  assert.equal(bs.endAnim.sq, expectSq, 'targets the losing king square');
  assert.ok(bs.endAnim.progress > 0 && bs.endAnim.progress <= 1, 'animating');
});

test('no end animation before the final move lands', () => {
  const { cfg, positions, moves } = build('goldcoins');
  const bs = scene.computeBoardState(cfg.dropAt - 0.1, cfg, positions, moves, theme);
  assert.ok(!bs.endAnim, 'no endAnim during the tension/drop');
});
