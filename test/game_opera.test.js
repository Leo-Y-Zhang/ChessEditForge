'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const chess = require('../src/chess.js');
const game = require('../src/game_opera.js');

test('Opera Game has 33 half-moves ending on Rd8#', () => {
  assert.equal(game.san.length, 33);
  assert.equal(game.san[game.finishPly], 'Rd8#');
});

test('the Opera Game replays (incl. Nbd7 disambiguation and O-O-O)', () => {
  const r = chess.replay(game.san);
  assert.equal(r.positions.length, 33);
  // 11...Nbd7: the b8-knight (not the f6-knight) goes to d7.
  const afterNbd7 = r.positions[21];
  assert.equal(afterNbd7[chess.sq('d7')], 'n', 'b8-knight moved to d7');
  assert.equal(afterNbd7[chess.sq('f6')], 'n', 'f6-knight stayed');
  assert.equal(afterNbd7[chess.sq('b8')], null, 'b8 vacated');
  // 12.O-O-O: white king to c1, rook to d1.
  const afterCastle = r.positions[22];
  assert.equal(afterCastle[chess.sq('c1')], 'K', 'white king castled to c1');
  assert.equal(afterCastle[chess.sq('d1')], 'R', 'rook to d1');
});

test('the final position is the real Rd8# opera mate', () => {
  const r = chess.replay(game.san);
  const f = r.positions[r.positions.length - 1];
  assert.equal(f[chess.sq('d8')], 'R', 'mating rook on d8');
  assert.equal(f[chess.sq('e8')], 'k', 'black king stranded on e8');
  assert.equal(f[chess.sq('g5')], 'B', 'bishop on g5 defends the rook');
  assert.equal(f[chess.sq('b8')], 'n', 'the knight that took the queen sits on b8');
  assert.equal(f.filter((p) => p === 'Q').length, 0, 'white queen sacrificed');
});

test('the mating move is the rook d1 -> d8', () => {
  const r = chess.replay(game.san);
  const last = r.moves[r.moves.length - 1];
  assert.equal(last.from, 'd1');
  assert.equal(last.to, 'd8');
});
