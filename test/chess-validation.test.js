'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const chess = require('../src/chess.js');

function position(pieces) {
  const board = chess.emptyBoard();
  for (const [square, piece] of Object.entries(pieces)) board[chess.sq(square)] = piece;
  return board;
}

test('SAN requires exactly one candidate and respects rank disambiguation', () => {
  const board = position({ h1: 'K', h8: 'k', a1: 'R', a3: 'R' });
  assert.deepEqual(chess.resolveSan(board, 'R1a2', 'w'), { from: 'a1', to: 'a2', promo: null });
  assert.deepEqual(chess.resolveSan(board, 'R3a2', 'w'), { from: 'a3', to: 'a2', promo: null });
  assert.throws(() => chess.resolveSan(board, 'Ra2', 'w'), /2 candidates/);
  assert.throws(() => chess.resolveSan(board, 'R2a2', 'w'), /0 candidates/);
  const changedColour = board.slice();
  changedColour[chess.sq('a1')] = 'r';
  assert.throws(() => chess.resolveSan(changedColour, 'R1a2', 'w'), /0 candidates/);
});

test('sliding moves require every intervening square to be empty', () => {
  for (const [piece, from, to, blocker] of [
    ['R', 'a1', 'a7', 'a4'], ['R', 'a1', 'g1', 'd1'], ['B', 'b1', 'g6', 'e4'],
  ]) {
    const board = position({ h2: 'K', h8: 'k', [from]: piece });
    assert.equal(chess.resolveSan(board, piece + to, 'w').from, from);
    for (const obstruction of ['P', 'p']) {
      board[chess.sq(blocker)] = obstruction;
      assert.throws(() => chess.resolveSan(board, piece + to, 'w'), /0 candidates/);
    }
  }
});

test('pawn double pushes require the starting rank and a clear intermediate square', () => {
  const board = position({ h1: 'K', a8: 'k', e2: 'P' });
  assert.equal(chess.resolveSan(board, 'e4', 'w').from, 'e2');
  board[chess.sq('e3')] = 'n';
  assert.throws(() => chess.resolveSan(board, 'e4', 'w'), /not a legal pawn move/);
  const advanced = position({ h1: 'K', a8: 'k', e3: 'P' });
  assert.equal(chess.resolveSan(advanced, 'e4', 'w').from, 'e3');
  assert.throws(() => chess.resolveSan(advanced, 'e5', 'w'), /not a legal pawn move/);
});

test('en passant needs the correct rank, enemy pawn and immediate history', () => {
  for (const [side, pawn, enemy, from, beside, san] of [
    ['w', 'P', 'p', 'e5', 'd5', 'exd6'], ['b', 'p', 'P', 'e4', 'd4', 'exd3'],
  ]) {
    const board = position({ h1: 'K', a8: 'k', [from]: pawn, [beside]: enemy });
    const to = san.slice(-2);
    const state = { castling: '', ep: chess.sq(to) };
    assert.equal(chess.resolveSan(board, san, side, state).from, from);
    assert.throws(() => chess.resolveSan(board, san, side, { ...state, ep: null }), /not a legal pawn move/);
    board[chess.sq(beside)] = pawn;
    assert.throws(() => chess.resolveSan(board, san, side, state), /not a legal pawn move/);
  }
  const wrongRank = position({ h1: 'K', a8: 'k', e4: 'P', d4: 'p' });
  assert.throws(() => chess.resolveSan(wrongRank, 'exd5', 'w'), /not a legal pawn move/);
});

test('castling validates home pieces, rights, every empty square and every king-path square', () => {
  for (const side of ['w', 'b']) {
    for (const long of [false, true]) {
      const rank = side === 'w' ? '1' : '8';
      const enemyRank = side === 'w' ? '4' : '5';
      const king = side === 'w' ? 'K' : 'k';
      const rook = side === 'w' ? 'R' : 'r';
      const enemyRook = side === 'w' ? 'r' : 'R';
      const home = 'e' + rank, rookHome = (long ? 'a' : 'h') + rank;
      const san = long ? 'O-O-O' : 'O-O';
      const board = position({ [home]: king, [rookHome]: rook });
      const state = { castling: 'KQkq', ep: null };
      assert.deepEqual(chess.resolveSan(board, san, side, state), { from: home, to: (long ? 'c' : 'g') + rank });
      assert.throws(() => chess.resolveSan(board, san, side, { ...state, castling: '' }), /right already lost/);
      for (const square of [home, rookHome]) {
        for (const replacement of [null, square === home ? (side === 'w' ? 'k' : 'K') : enemyRook]) {
          const bad = board.slice();
          bad[chess.sq(square)] = replacement;
          assert.throws(() => chess.resolveSan(bad, san, side, state), /home square/);
        }
      }
      for (const file of long ? ['b', 'c', 'd'] : ['f', 'g']) {
        const bad = board.slice();
        bad[chess.sq(file + rank)] = side === 'w' ? 'N' : 'n';
        assert.throws(() => chess.resolveSan(bad, san, side, state), /pieces between/);
      }
      for (const file of long ? ['e', 'd', 'c'] : ['e', 'f', 'g']) {
        const bad = board.slice();
        bad[chess.sq(file + enemyRank)] = enemyRook;
        assert.throws(() => chess.resolveSan(bad, san, side, state), /out of, through or into check/);
      }
    }
  }
});

test('capturing a home rook removes its castling right even if a rook returns there', () => {
  const nextState = require('../test/helpers/load-private.js')('src/chess.js', 'nextState');
  for (const [home, rights, side, king, rook] of [
    ['h8', 'KQq', 'b', 'k', 'r'], ['a8', 'KQk', 'b', 'k', 'r'],
    ['h1', 'Qkq', 'w', 'K', 'R'], ['a1', 'Kkq', 'w', 'K', 'R'],
  ]) {
    const board = position({ b4: side === 'w' ? 'q' : 'Q', [home]: rook });
    const state = nextState(board, { from: 'b4', to: home }, { castling: 'KQkq', ep: null });
    assert.equal(state.castling, rights);
    const restored = position({ ['e' + home[1]]: king, [home]: rook });
    const san = home[0] === 'a' ? 'O-O-O' : 'O-O';
    assert.doesNotThrow(() => chess.resolveSan(restored, san, side, { castling: 'KQkq', ep: null }));
    assert.throws(() => chess.resolveSan(restored, san, side, state), /right already lost/);
  }
});

test('attack detection includes h1 and distinguishes the attacking colour', () => {
  const board = position({ a1: 'K', h8: 'k', h1: 'R' });
  assert.equal(chess.isAttacked(board, chess.sq('h8'), 'w'), true);
  assert.equal(chess.isInCheck(board, 'b'), true);
  assert.equal(chess.isAttacked(board, chess.sq('h8'), 'b'), false);
  board[chess.sq('h4')] = 'p';
  assert.equal(chess.isAttacked(board, chess.sq('h8'), 'w'), false);
});

test('replay accepts a complete mate and rejects changed signs, result position and truncated SAN', () => {
  const moves = ['f3', 'e5', 'g4', 'Qh4#'];
  const replay = chess.replay([...moves, '0-1']);
  assert.equal(replay.moves.length, 4);
  assert.equal(replay.positions.length, 4);
  assert.equal(chess.isInCheck(replay.positions[3], 'w'), true);
  for (const last of ['Qh4', 'Qh4+', 'Qh', 'Qh4#garbage']) {
    assert.throws(() => chess.replay([...moves.slice(0, -1), last]), /resolveSan/);
  }
  assert.throws(() => chess.replay(['f3', '0-1', ...moves.slice(1)]), /before the last move/);
});
