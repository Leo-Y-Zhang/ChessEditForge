'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const chess = require('../src/chess.js');
const game = require('../src/game.js');

test('featured game has 99 half-moves ending on the queen sacrifice', () => {
  assert.equal(game.san.length, 99);
  assert.equal(game.san[game.finishPly], 'Qh6+');
});

test('the whole game replays without ambiguity', () => {
  // Should not throw for any move.
  const r = chess.replay(game.san);
  assert.equal(r.positions.length, 99);
  assert.equal(r.moves.length, 99);
});

test('the final position is the real 50.Qh6+ mating picture', () => {
  const r = chess.replay(game.san);
  const final = r.positions[r.positions.length - 1];
  // White queen sacrificed onto h6, next to the black king on h7.
  assert.equal(final[chess.sq('h6')], 'Q', 'white queen on h6');
  assert.equal(final[chess.sq('h7')], 'k', 'black king on h7');
  // The two white rooks that deliver the forced mate.
  assert.equal(final[chess.sq('c8')], 'R', 'white rook on c8');
  assert.equal(final[chess.sq('f5')], 'R', 'white rook on f5');
  // Black pieces marooned on the queenside / back.
  assert.equal(final[chess.sq('a2')], 'r', 'black rook on a2');
  assert.equal(final[chess.sq('f2')], 'q', 'black queen on f2');
  // White king tucked on h1 after 48.Kh1.
  assert.equal(final[chess.sq('h1')], 'K', 'white king on h1');
  // Castled square vacated.
  assert.equal(final[chess.sq('g8')], null, 'black king no longer on g8');
});

test('the finishing move is the queen gliding f4 -> h6', () => {
  const r = chess.replay(game.san);
  const last = r.moves[r.moves.length - 1];
  assert.equal(last.from, 'f4');
  assert.equal(last.to, 'h6');
  assert.equal(last.side, 'w');
});
