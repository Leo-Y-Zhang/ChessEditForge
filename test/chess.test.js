'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const chess = require('../src/chess.js');

// Board layout convention: 64-length array, index = rowFromTop*8 + file.
// row 0 = rank 8 (top), file 0 = a-file. So 'a8' = index 0, 'h1' = index 63.

test('startPosition places pieces on the standard squares', () => {
  const b = chess.startPosition();
  assert.equal(b.length, 64);
  assert.equal(b[chess.sq('a8')], 'r');
  assert.equal(b[chess.sq('e8')], 'k');
  assert.equal(b[chess.sq('e1')], 'K');
  assert.equal(b[chess.sq('d1')], 'Q');
  assert.equal(b[chess.sq('e2')], 'P');
  assert.equal(b[chess.sq('e7')], 'p');
  assert.equal(b[chess.sq('e4')], null);
});

test('sq and name round-trip for every square', () => {
  for (const f of 'abcdefgh') {
    for (let r = 1; r <= 8; r++) {
      const nm = f + r;
      assert.equal(chess.name(chess.sq(nm)), nm);
    }
  }
});

test('sq maps e4 to the expected index', () => {
  assert.equal(chess.sq('e4'), 36); // rowFromTop 4, file 4
});

test('applyMove moves a piece and clears the origin (immutable)', () => {
  const b = chess.startPosition();
  const b2 = chess.applyMove(b, { from: 'e2', to: 'e4' });
  assert.equal(b2[chess.sq('e4')], 'P');
  assert.equal(b2[chess.sq('e2')], null);
  // original board untouched
  assert.equal(b[chess.sq('e2')], 'P');
  assert.equal(b[chess.sq('e4')], null);
});

test('applyMove captures the piece on the destination square', () => {
  let b = chess.startPosition();
  b = chess.applySan(b, 'e4', 'w');
  b = chess.applySan(b, 'd5', 'b');
  b = chess.applyMove(b, { from: 'e4', to: 'd5' }); // exd5
  assert.equal(b[chess.sq('d5')], 'P');
  assert.equal(b[chess.sq('e4')], null);
});

test('applySan resolves a pawn double-push', () => {
  const b = chess.applySan(chess.startPosition(), 'e4', 'w');
  assert.equal(b[chess.sq('e4')], 'P');
  assert.equal(b[chess.sq('e2')], null);
});

test('applySan resolves a knight move', () => {
  const b = chess.applySan(chess.startPosition(), 'Nf3', 'w');
  assert.equal(b[chess.sq('f3')], 'N');
  assert.equal(b[chess.sq('g1')], null);
});

test('applySan handles kingside castling (king and rook both move)', () => {
  // Clear f1,g1 and knight/bishop so the king can castle.
  let b = chess.startPosition();
  b = chess.applySan(b, 'e4', 'w');
  b = chess.applySan(b, 'e5', 'b');
  b = chess.applySan(b, 'Nf3', 'w');
  b = chess.applySan(b, 'Nc6', 'b');
  b = chess.applySan(b, 'Bc4', 'w');
  b = chess.applySan(b, 'Bc5', 'b');
  b = chess.applySan(b, 'O-O', 'w');
  assert.equal(b[chess.sq('g1')], 'K');
  assert.equal(b[chess.sq('f1')], 'R');
  assert.equal(b[chess.sq('e1')], null);
  assert.equal(b[chess.sq('h1')], null);
});

test('applySan handles queenside castling', () => {
  // Build a position where white can castle long.
  let b = chess.startPosition();
  for (const [m, s] of [['d4','w'],['d5','b'],['Nc3','w'],['Nc6','b'],
                        ['Bf4','w'],['Bf5','b'],['Qd2','w'],['Qd7','b']]) {
    b = chess.applySan(b, m, s);
  }
  b = chess.applySan(b, 'O-O-O', 'w');
  assert.equal(b[chess.sq('c1')], 'K');
  assert.equal(b[chess.sq('d1')], 'R');
  assert.equal(b[chess.sq('a1')], null);
  assert.equal(b[chess.sq('e1')], null);
});

test('applySan handles en passant (removes the passed pawn)', () => {
  let b = chess.startPosition();
  b = chess.applySan(b, 'e4', 'w');
  b = chess.applySan(b, 'a6', 'b');
  b = chess.applySan(b, 'e5', 'w');
  b = chess.applySan(b, 'd5', 'b');   // black pawn d7-d5 beside white e5 pawn
  b = chess.applySan(b, 'exd6', 'w'); // en passant
  assert.equal(b[chess.sq('d6')], 'P');
  assert.equal(b[chess.sq('e5')], null);
  assert.equal(b[chess.sq('d5')], null); // captured pawn removed
});

test('applySan handles promotion', () => {
  // Hand-craft a position with a white pawn on e7 ready to promote.
  const b = chess.emptyBoard();
  b[chess.sq('e7')] = 'P';
  b[chess.sq('e1')] = 'K';
  b[chess.sq('a8')] = 'k';
  const b2 = chess.applySan(b, 'e8=Q', 'w');
  assert.equal(b2[chess.sq('e8')], 'Q');
  assert.equal(b2[chess.sq('e7')], null);
});

test('applySan disambiguates by file when two knights can reach a square', () => {
  // Knights on b1 and f3 (via d2) — Nbd2 vs Nfd2 style. Use rank-1 knights.
  const b = chess.emptyBoard();
  b[chess.sq('e1')] = 'K';
  b[chess.sq('a8')] = 'k';
  b[chess.sq('b1')] = 'N';
  b[chess.sq('f1')] = 'N';
  // Both b1 and f1 knights can jump to d2. 'Nbd2' picks the b1 knight.
  const b2 = chess.applySan(b, 'Nbd2', 'w');
  assert.equal(b2[chess.sq('d2')], 'N');
  assert.equal(b2[chess.sq('b1')], null);
  assert.equal(b2[chess.sq('f1')], 'N'); // untouched
});

test('replay applies a sequence and reports one position per half-move', () => {
  const sans = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']; // Ruy Lopez opening moves
  const r = chess.replay(sans);
  assert.equal(r.moves.length, 5);
  assert.equal(r.positions.length, 5);
  const last = r.positions[4];
  assert.equal(last[chess.sq('b5')], 'B');
  assert.equal(last[chess.sq('f3')], 'N');
  assert.equal(r.moves[4].from, 'f1');
  assert.equal(r.moves[4].to, 'b5');
  assert.equal(r.moves[0].side, 'w');
  assert.equal(r.moves[1].side, 'b');
});
