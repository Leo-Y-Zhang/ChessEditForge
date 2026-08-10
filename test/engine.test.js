'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/engine.js');

test('easing functions are anchored at 0 and 1', () => {
  for (const fn of [E.ease.outCubic, E.ease.inOutCubic, E.ease.outExpo, E.ease.outBack]) {
    assert.ok(Math.abs(fn(0) - 0) < 1e-9, `${fn.name}(0)`);
    assert.ok(Math.abs(fn(1) - 1) < 1e-9, `${fn.name}(1)`);
  }
});

test('outCubic is monotonically increasing', () => {
  let prev = -Infinity;
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const v = E.ease.outCubic(Math.min(t, 1));
    assert.ok(v >= prev - 1e-9, `monotonic at ${t}`);
    prev = v;
  }
});

test('clamp01 and lerp behave', () => {
  assert.equal(E.ease.clamp01(-2), 0);
  assert.equal(E.ease.clamp01(2), 1);
  assert.equal(E.ease.clamp01(0.4), 0.4);
  assert.equal(E.ease.lerp(10, 20, 0.5), 15);
});

test('activeCaptions returns only captions live at time t', () => {
  const caps = [
    { text: 'A', start: 0, end: 2, style: 'x' },
    { text: 'B', start: 3, end: 5, style: 'x' },
  ];
  const at1 = E.activeCaptions(caps, 1).map((c) => c.cap.text);
  assert.deepEqual(at1, ['A']);
  const at4 = E.activeCaptions(caps, 4).map((c) => c.cap.text);
  assert.deepEqual(at4, ['B']);
  const at2p5 = E.activeCaptions(caps, 2.5).map((c) => c.cap.text);
  assert.deepEqual(at2p5, []);
});

test('caption opacity ramps in then out', () => {
  const caps = [{ text: 'A', start: 1, end: 3, style: 'x', inDur: 0.5, outDur: 0.5 }];
  const mid = E.activeCaptions(caps, 2)[0];
  assert.ok(Math.abs(mid.opacity - 1) < 1e-9, 'full at middle');
  const rampingIn = E.activeCaptions(caps, 1.25)[0];
  assert.ok(rampingIn.opacity > 0 && rampingIn.opacity < 1, 'partway in');
  const rampingOut = E.activeCaptions(caps, 2.75)[0];
  assert.ok(rampingOut.opacity > 0 && rampingOut.opacity < 1, 'partway out');
});

test('plyAt maps the flurry window onto move indices', () => {
  const cfg = { flurryStart: 4, flurryEnd: 8, flurryFromPly: 56, flurryToPly: 71 };
  const startP = E.plyAt(cfg, 4);
  assert.equal(startP.ply, 56);
  assert.ok(startP.progress < 1e-9);
  // Just before the end we are on the last ply.
  const endP = E.plyAt(cfg, 7.999);
  assert.equal(endP.ply, 71);
  // Before the window starts we clamp to the first ply.
  assert.equal(E.plyAt(cfg, 0).ply, 56);
  // After the window we clamp to the last ply.
  assert.equal(E.plyAt(cfg, 100).ply, 71);
});
