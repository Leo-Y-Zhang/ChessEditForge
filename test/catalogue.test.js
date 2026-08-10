'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const chess = require('../src/chess.js');
const EDITS = require('../src/edits.js');

for (const id of Object.keys(EDITS)) {
  const e = EDITS[id];
  const game = require('../src/' + e.game + '.js');
  const d = e.def;

  test(`${id}: game replays cleanly to its finish`, () => {
    const r = chess.replay(game.san);
    assert.equal(r.positions.length, game.san.length);
    assert.equal(game.finishPly, game.san.length - 1, 'finishPly is the last ply');
  });

  test(`${id}: edit definition ply windows are valid`, () => {
    const last = game.san.length - 1;
    assert.ok(d.montage.fromPly >= 0 && d.montage.toPly <= last, 'montage in range');
    assert.ok(d.montage.fromPly < d.montage.toPly, 'montage spans forward');
    assert.ok(d.drop.fromPly > d.montage.toPly, 'drop starts after montage');
    assert.ok(d.drop.toPly <= last, 'drop ends within game');
    assert.equal(d.drop.toPly, last, 'drop ends on the mating move');
    for (const b of (d.badges || [])) {
      assert.ok(b.ply >= 0 && b.ply <= last, `badge ply ${b.ply} in range`);
    }
    // keyPlies (extra montage dwell) must be real montage moves, not badges
    const badged = new Set((d.badges || []).map((b) => b.ply));
    for (const p of (d.montage.keyPlies || [])) {
      assert.ok(p >= d.montage.fromPly && p <= d.montage.toPly, `keyPly ${p} inside the montage`);
      assert.ok(!badged.has(p), `keyPly ${p} not already badged`);
      assert.ok(typeof game.san[p] === 'string', `keyPly ${p} is a real move`);
    }
  });

  if (d.drop.mateKingSq) {
    test(`${id}: the losing king really sits on mateKingSq at the end`, () => {
      const r = chess.replay(game.san);
      const f = r.positions[r.positions.length - 1];
      const p = f[chess.sq(d.drop.mateKingSq)];
      assert.ok(p === 'k' || p === 'K', `a king stands on ${d.drop.mateKingSq} (got ${p})`);
    });
  }
}
