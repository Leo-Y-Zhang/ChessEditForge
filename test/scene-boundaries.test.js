'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const chess = require('../src/chess.js');
const scene = require('../src/scene.js');

const { positions, moves } = chess.replay(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'd3']);
const theme = { board: { lastFrom: 'from', lastTo: 'to' }, accent: 'gold' };
const cfg = {
  flurryFromPly: 0, flurryToPly: 1, flurryStart: 1, flurryEnd: 3, settleAt: 3.1,
  bridgeStart: 4, bridgeEnd: 7, bridgeFromPly: 2, bridgeToPly: 4,
  dropAt: 8, dropDur: 3, dropFromPly: 5, dropToPly: 6,
  dropSchedule: [{ ply: 5, start: 8, end: 9 }, { ply: 6, start: 9, end: 11 }],
};
const at = (t) => scene.computeBoardState(t, cfg, positions, moves, theme);

function assertMoving(state, ply) {
  assert.deepEqual(state.position, ply === 0 ? chess.startPosition() : positions[ply - 1]);
  assert.equal(state.move.from, moves[ply].from);
  assert.equal(state.move.to, moves[ply].to);
  assert.equal(state.move.piece, state.position[chess.sq(moves[ply].from)]);
}

test('montage starts from the initial board and begins moving at the exact start', () => {
  assert.deepEqual(at(0).position, chess.startPosition());
  assert.equal(at(0).move, undefined);
  const state = at(1);
  assertMoving(state, 0);
  assert.equal(state.move.progress, 0);
});

test('bridge shows each intervening ply and settles at its exact end', () => {
  assert.equal(at(3.5).position, positions[1]);
  assert.equal(at(3.5).move, undefined);
  for (const [time, ply] of [[4, 2], [5, 3], [6, 4]]) {
    const state = at(time);
    assertMoving(state, ply);
    assert.equal(state.move.progress, 0);
  }
  const held = at(6.75);
  assertMoving(held, 4);
  assert.equal(held.move.progress, 1);
  assert.equal(at(7).position, positions[4]);
  assert.equal(at(7).move, undefined);
});

test('drop switches weighted slots at the boundary and ends on the final board', () => {
  assertMoving(at(9 - 1e-6), 5);
  const state = at(9);
  assertMoving(state, 6);
  assert.equal(state.move.progress, 0);
  assert.equal(at(11).position, positions[6]);
  assert.equal(at(11).move, undefined);
});
