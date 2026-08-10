'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const chess = require('../src/chess.js');
const game = require('../src/game_immortal.js');

test('Immortal Game has 45 half-moves ending on Be7#', () => {
  assert.equal(game.san.length, 45);
  assert.equal(game.san[game.finishPly], 'Be7#');
});

test('the whole Immortal Game replays without ambiguity', () => {
  const r = chess.replay(game.san);
  assert.equal(r.positions.length, 45);
});

test('the final position is the real Be7# mate picture', () => {
  const r = chess.replay(game.san);
  const f = r.positions[r.positions.length - 1];
  assert.equal(f[chess.sq('e7')], 'B', 'mating bishop on e7');
  assert.equal(f[chess.sq('d8')], 'k', 'black king on d8');
  assert.equal(f[chess.sq('d5')], 'N', 'knight guards on d5');
  assert.equal(f[chess.sq('g7')], 'N', 'knight guards e8 from g7');
  // White really is down the queen and both rooks at mate.
  const whiteQ = f.filter((p) => p === 'Q').length;
  const whiteR = f.filter((p) => p === 'R').length;
  assert.equal(whiteQ, 0, 'white queen sacrificed');
  assert.equal(whiteR, 0, 'both white rooks sacrificed');
  // Black still has almost everything (queen + both rooks) and is mated anyway.
  assert.equal(f[chess.sq('a1')], 'q', 'black queen still on a1');
  assert.equal(f.filter((p) => p === 'r').length, 2, 'black keeps both rooks');
});

test('the mating move is the bishop d6 -> e7', () => {
  const r = chess.replay(game.san);
  const last = r.moves[r.moves.length - 1];
  assert.equal(last.from, 'd6');
  assert.equal(last.to, 'e7');
  assert.equal(last.side, 'w');
});
