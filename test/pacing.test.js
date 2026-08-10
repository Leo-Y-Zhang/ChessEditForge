'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const storygen = require('../src/storygen.js');
const EDITS = require('../src/edits.js');

// House-tempo invariants: the biggest moves get real time on screen, the
// mate/resign reveal is never squeezed, the outro never feels rushed, and the
// board NEVER teleports — every ply from the first montage move to the final
// move is shown (montage, then bridge fast-forward, then drop).
for (const id of Object.keys(EDITS)) {
  const def = EDITS[id].def;
  const { cfg, captions } = storygen.makeStoryboard(def);

  test(`${id}: timeline is ordered and inside the duration`, () => {
    assert.ok(cfg.coldEnd < cfg.boardFadeStart, 'cold open before board');
    assert.ok(cfg.boardFadeEnd < cfg.flurryStart + 0.2, 'board in before montage');
    assert.ok(cfg.flurryStart < cfg.flurryEnd, 'montage spans forward');
    if (cfg.bridgeStart != null) {
      assert.ok(cfg.flurryEnd < cfg.bridgeStart, 'bridge after montage settles');
      assert.ok(cfg.bridgeStart < cfg.bridgeEnd, 'bridge spans forward');
      assert.ok(cfg.bridgeEnd < cfg.tensionStart, 'tension after bridge');
    }
    assert.ok(cfg.flurryEnd < cfg.tensionStart, 'tension after montage');
    assert.ok(cfg.tensionStart < cfg.dropAt, 'drop after tension');
    assert.ok(cfg.dropAt + cfg.dropDur < cfg.mateRevealEnd, 'reveal after drop');
    assert.ok(cfg.mateRevealEnd <= cfg.outroStart, 'outro after reveal');
    assert.ok(cfg.outroStart < cfg.fadeStart, 'fade inside outro');
    assert.ok(cfg.fadeStart < cfg.duration, 'fade before end');
    for (const c of captions) {
      assert.ok(c.start >= 0 && c.end <= cfg.duration, `caption "${c.text}" within video`);
      assert.ok(c.start < c.end, `caption "${c.text}" spans forward`);
    }
  });

  test(`${id}: the board never teleports — every ply is shown`, () => {
    // montage covers its window
    const sched = cfg.flurrySchedule;
    assert.ok(sched && sched.length === cfg.flurryToPly - cfg.flurryFromPly + 1,
      'montage schedule covers every montage ply');
    assert.ok(Math.abs(sched[0].start - cfg.flurryStart) < 1e-6, 'schedule starts with montage');
    assert.ok(Math.abs(sched[sched.length - 1].end - cfg.flurryEnd) < 1e-6, 'schedule ends with montage');
    for (let i = 1; i < sched.length; i++) {
      assert.equal(sched[i].ply, sched[i - 1].ply + 1, 'schedule plies consecutive');
      assert.ok(Math.abs(sched[i].start - sched[i - 1].end) < 1e-6, 'schedule slots contiguous');
    }
    // any gap to the finish is bridged, never skipped
    const gap = cfg.dropFromPly - cfg.flurryToPly - 1;
    if (gap > 0) {
      assert.ok(cfg.bridgeStart != null, `a ${gap}-ply gap has a bridge`);
      assert.equal(cfg.bridgeFromPly, cfg.flurryToPly + 1, 'bridge starts after montage');
      assert.equal(cfg.bridgeToPly, cfg.dropFromPly - 1, 'bridge reaches the finish');
      const rate = gap / (cfg.bridgeEnd - cfg.bridgeStart);
      assert.ok(rate <= 12.01, `bridge fast-forward is watchable (${rate.toFixed(1)} plies/s)`);
      assert.ok(cfg.bridgeEnd - cfg.bridgeStart >= 0.99, 'bridge is not a blink');
    } else {
      assert.equal(cfg.bridgeStart, undefined, 'no bridge when the finish is contiguous');
    }
    // drop covers its window
    const ds = cfg.dropSchedule;
    assert.ok(ds && ds.length === cfg.dropToPly - cfg.dropFromPly + 1,
      'drop schedule covers every finish ply');
    for (let i = 1; i < ds.length; i++) {
      assert.equal(ds[i].ply, ds[i - 1].ply + 1, 'drop plies consecutive');
      assert.ok(Math.abs(ds[i].start - ds[i - 1].end) < 1e-6, 'drop slots contiguous');
    }
  });

  test(`${id}: the finish and outro get room to breathe`, () => {
    for (const s of cfg.dropSchedule) {
      assert.ok(s.end - s.start >= 0.5, `drop move ${s.ply} holds >= 0.5s`);
    }
    const last = cfg.dropSchedule[cfg.dropSchedule.length - 1];
    if (cfg.dropSchedule.length > 1) {
      const first = cfg.dropSchedule[0];
      assert.ok((last.end - last.start) > (first.end - first.start) * 1.3,
        'the FINAL move holds noticeably longer than the others');
    }
    assert.ok(cfg.mateRevealEnd - (cfg.dropAt + cfg.dropDur) >= 2.5,
      'mate/resign reveal holds >= 2.5s');
    assert.ok(cfg.duration - cfg.outroStart >= 4.0, 'outro holds >= 4s');
    for (const s of cfg.flurrySchedule) {
      assert.ok(s.end - s.start >= 0.29, `montage move ${s.ply} is not a blur`);
    }
    assert.ok(cfg.duration <= 30, 'still a short-form cut');
  });
}
