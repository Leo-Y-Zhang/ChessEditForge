'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const chess = require('../src/chess.js');
const EDITS = require('../src/edits.js');

// replay() is what every render and the browser player run on a game's move
// list, and a new game is added by hand-typing SAN. The resolver used to trust
// the list completely: a typo that is not a chess move still "replayed" -
// a bishop pushed like a pawn, a king castled through its own pieces - and
// the edit rendered an impossible game. Each case below replayed without a
// complaint before the resolver checked legality.

const illegal = (sans) => assert.throws(() => chess.replay(sans), /resolveSan|replay/);

test('a pawn push cannot move another piece standing behind it', () => {
  // e2 holds a bishop, not a pawn: "e4" used to push the bishop to e4.
  illegal(['e4', 'd5', 'exd5', 'Qxd5', 'Be2', 'a6', 'e4']);
});

test('a pawn move cannot be made by a piece standing where the pawn would be', () => {
  // "a6" for Black with the a-pawn gone: a8 holds a rook, which can reach a6.
  illegal(['a4', 'a5', 'b4', 'axb4', 'Nf3', 'a6']);
  // "gxh3" with a bishop, not a pawn, on g4.
  illegal(['e4', 'e5', 'h3', 'd6', 'g3', 'Bg4', 'Nc3', 'gxh3']);
});

test('a pawn capture needs a pawn on the source file', () => {
  // Nothing on e4 to capture with.
  illegal(['d4', 'd5', 'exd5']);
});

test('a pawn cannot push onto an occupied square', () => {
  illegal(['e4', 'e5', 'e5']);
});

test('a move may not capture a piece of its own colour', () => {
  illegal(['Nd2']);
});

test('a side in check must answer the check', () => {
  illegal(['e4', 'f6', 'Qh5+', 'a6']);
});

test('a pinned piece cannot move off the pin line', () => {
  // The only knight that reaches e7 is pinned to its king by the bishop on b5.
  illegal(['e4', 'd5', 'Bb5+', 'Nc6', 'Nf3', 'Nf6', 'Nc3', 'Ne5']);
});

test('castling needs empty squares between king and rook', () => {
  illegal(['O-O']);
});

test('castling is refused after the king has moved', () => {
  illegal(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'Ke2', 'Nf6', 'Ke1', 'Ng4', 'O-O']);
});

test('castling is refused out of or through check', () => {
  // With the f-pawn gone, Black's bishop on c5 sees g1: O-O would land the
  // king in check.
  illegal(['e4', 'e5', 'Nf3', 'Bc5', 'Bc4', 'Nf6', 'd3', 'd6', 'Nxe5', 'dxe5', 'f3', 'Nh5',
    'f4', 'exf4', 'O-O']);
});

test('en passant is only available straight after the double push', () => {
  illegal(['e4', 'a6', 'e5', 'd5', 'a3', 'a5', 'exd6']);
});

test('a pawn reaching the last rank must promote, and only there', () => {
  const b = chess.emptyBoard();
  b[chess.sq('e7')] = 'P';
  b[chess.sq('e1')] = 'K';
  b[chess.sq('a8')] = 'k';
  assert.throws(() => chess.resolveSan(b, 'e8', 'w'), /resolveSan/);
  const b2 = chess.emptyBoard();
  b2[chess.sq('e6')] = 'P';
  b2[chess.sq('e1')] = 'K';
  b2[chess.sq('a8')] = 'k';
  assert.throws(() => chess.resolveSan(b2, 'e7=Q', 'w'), /resolveSan/);
});

test('promotion is read with or without "=" and in either case', () => {
  const b = chess.emptyBoard();
  b[chess.sq('e7')] = 'P';
  b[chess.sq('e1')] = 'K';
  b[chess.sq('a8')] = 'k';
  for (const san of ['e8=Q', 'e8Q', 'e8=q']) {
    assert.deepEqual(chess.resolveSan(b, san, 'w'), { from: 'e7', to: 'e8', promo: 'Q' }, san);
  }
  assert.deepEqual(chess.resolveSan(b, 'e8=N', 'w'), { from: 'e7', to: 'e8', promo: 'N' });
});

test('a capture sign must match the board', () => {
  illegal(['Nxf3']); // nothing to take on f3
  illegal(['Nc3', 'd5', 'Nd5']); // Nxd5 written without the x
});

test('the check and mate signs must match the board', () => {
  illegal(['e4+']); // no check
  illegal(['e4', 'f6', 'Qh5']); // Qh5 gives check but carries no sign
  illegal(['f3', 'e5', 'g4', 'Qh4+']); // it is mate, not just check
  illegal(['e4', 'f6', 'Qh5#']); // check, but ...g6 answers it
  assert.equal(chess.replay(['f3', 'e5', 'g4', 'Qh4#']).positions.length, 4);
});

test('move numbers and stray tokens are refused with a clear message', () => {
  assert.throws(() => chess.replay(['1.', 'e4']), /unreadable SAN/);
  assert.throws(() => chess.replay(['Zz9']), /unreadable SAN/);
});

test('a result token is accepted only as the last entry', () => {
  assert.equal(chess.replay(['e4', 'e5', '1-0']).positions.length, 2);
  illegal(['e4', '1-0', 'e5']);
});

test('0-0 and 0-0-0 are read as castling', () => {
  const r = chess.replay(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', '0-0']);
  const f = r.positions[r.positions.length - 1];
  assert.equal(f[chess.sq('g1')], 'K');
  assert.equal(f[chess.sq('f1')], 'R');
});

test('every catalogue game is legal move by move, signs included', () => {
  for (const id of Object.keys(EDITS)) {
    const game = require('../src/' + EDITS[id].game + '.js');
    assert.doesNotThrow(() => chess.replay(game.san), id);
  }
});
