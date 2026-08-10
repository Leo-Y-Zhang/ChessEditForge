'use strict';
/*
 * storygen.js — the edit factory. Turns a compact edit definition into a full
 * premium storyboard {cfg, captions}: a setup intro card, a name-slam hook,
 * an escalating montage with move-quality badges, a tension push, a
 * sacrifice->mate drop with impact effects, and a legend outro — all paced to
 * the edit's duration and consistent across every edit (the house style).
 *
 * A definition looks like:
 *   { id, coldPiece, accent, duration,
 *     intro:{kicker,white,black,note}, hook:['A','B'], context:'...',
 *     montage:{fromPly,toPly}, beats:['..','..'], tension:'..',
 *     drop:{fromPly,toPly,line,mateKingSq,glowSq,focusSq,settleHighlight?},
 *     badges:[{ply|at,sq,type}], finishKicker:'..', factKicker:'..',
 *     outro:{title,tag} }
 */
const r2 = (x) => Math.round(x * 100) / 100;

function makeStoryboard(def) {
  // House tempo v3. The intro keeps its absolute timings (its pacing is right).
  // Everything after it is built ADDITIVELY so nothing downstream is ever
  // squeezed: a weighted montage (the key moves hold longest), an automatic
  // fast-forward BRIDGE over any ply gap (the board never teleports), a
  // tension beat, a weighted drop (the final move holds longest), a long
  // mate/resign reveal, and an unhurried outro.
  const TEMPO = 1.10;
  const REVEAL_HOLD = 2.6;   // CHECKMATE/RESIGNS + kickers stay this long
  const OUTRO_SPAN = 4.4;    // legend card + follow CTA; never rushed
  const C = r2((def.duration || 18) * TEMPO);   // sizes the montage window
  const A = def.accent || '#e6b03e';
  const drop = def.drop;
  const nDrop = drop.toPly - drop.fromPly + 1;

  const flurryStart = 4.2;

  // ---- montage schedule: important moves get the time they deserve ----
  // (weights first; the window stretches if needed so no move is ever a blur)
  const badgedPlies = new Set((def.badges || []).map((b) => b.ply));
  const keyPlies = new Set((def.montage.keyPlies || []));
  const flurrySchedule = [];
  let flurryEnd;
  {
    const from = def.montage.fromPly, to = def.montage.toPly;
    const w = [];
    for (let p = from; p <= to; p++) {
      w.push(badgedPlies.has(p) ? 1.85 : keyPlies.has(p) ? 1.5 : 1.0);
    }
    const total = w.reduce((a, b) => a + b, 0);
    const MIN_SLOT = 0.31;
    const win = Math.max(C * 0.56 - flurryStart, total * MIN_SLOT);
    flurryEnd = r2(flurryStart + win);
    let tAt = flurryStart;
    for (let i = 0; i < w.length; i++) {
      const end = i === w.length - 1 ? flurryEnd : tAt + (w[i] / total) * (flurryEnd - flurryStart);
      flurrySchedule.push({ ply: from + i, start: tAt, end });
      tAt = end;
    }
  }

  // ---- bridge: if the finish starts later in the game, fast-forward the
  // in-between moves instead of jumping the board to a new position ----
  const gap = drop.fromPly - def.montage.toPly - 1;
  let bridge = null;
  if (gap > 0) {
    const start = r2(flurryEnd + 0.5);
    const dur = Math.min(Math.max(0.15 * gap, 1.0), 3.4);
    bridge = { start, end: r2(start + dur), fromPly: def.montage.toPly + 1, toPly: drop.fromPly - 1 };
  }

  const tensionStart = r2((bridge ? bridge.end : flurryEnd) + 0.25);
  const dropAt = r2(tensionStart + 2.45);

  // ---- drop schedule: every finish move lands with weight; the FINAL move
  // (the mate / the resignation-forcer) holds the longest ----
  const dropSchedule = [];
  let dropDur;
  {
    const FINAL_W = 1.55;
    if (nDrop === 1) {
      dropDur = 1.35;
      dropSchedule.push({ ply: drop.fromPly, start: dropAt, end: r2(dropAt + dropDur) });
    } else {
      const sumW = (nDrop - 1) + FINAL_W;
      const unit = Math.min(0.85, 4.6 / sumW);
      dropDur = r2(unit * sumW);
      let tAt = dropAt;
      for (let p = drop.fromPly; p <= drop.toPly; p++) {
        const end = p === drop.toPly ? r2(dropAt + dropDur) : r2(tAt + unit);
        dropSchedule.push({ ply: p, start: r2(tAt), end });
        tAt = end;
      }
    }
  }

  const mateRevealStart = r2(dropAt + dropDur + 0.1);
  const mateRevealEnd = r2(mateRevealStart + REVEAL_HOLD);
  const outroStart = mateRevealEnd;
  const D = r2(outroStart + OUTRO_SPAN);
  const fadeStart = r2(D - 1.15);

  const cfg = {
    duration: D,
    coldEnd: 1.5, coldPiece: def.coldPiece || 'K',
    boardFadeStart: 3.15, boardFadeEnd: 4.05,
    flurryStart, flurryEnd, flurryFromPly: def.montage.fromPly, flurryToPly: def.montage.toPly,
    flurrySchedule,
    settleAt: r2(flurryEnd + 0.05),
    prePly: drop.fromPly - 1,
    tensionStart,
    dropAt, dropDur, dropFromPly: drop.fromPly, dropToPly: drop.toPly,
    dropSchedule,
    mateKingSq: drop.mateKingSq, glowSq: drop.glowSq, focusSq: drop.focusSq,
    resign: drop.endWord === 'RESIGNS',
    settleHighlight: drop.settleHighlight,
    mateRevealStart, mateRevealEnd, outroStart, fadeStart,
    focusSqDup: drop.focusSq,
    vignetteBase: 0.62, grainAmount: 0.06,
    badges: [], impacts: [],
  };
  if (bridge) {
    cfg.bridgeStart = bridge.start; cfg.bridgeEnd = bridge.end;
    cfg.bridgeFromPly = bridge.fromPly; cfg.bridgeToPly = bridge.toPly;
  }

  function plyTime(p) {
    for (const s of dropSchedule) if (s.ply === p) return r2(s.start + 0.72 * (s.end - s.start));
    for (const s of flurrySchedule) if (s.ply === p) return r2(s.start + 0.72 * (s.end - s.start));
    if (bridge && p >= bridge.fromPly && p <= bridge.toPly) {
      const n = bridge.toPly - bridge.fromPly + 1;
      return r2(bridge.start + ((p - bridge.fromPly + 0.72) / n) * (bridge.end - bridge.start));
    }
    return dropAt;
  }
  cfg.badges = (def.badges || []).map((b) => ({
    at: b.at != null ? b.at : plyTime(b.ply), sq: b.sq, type: b.type, dur: b.dur || 2.1,
  }));

  const caps = [];
  const push = (c) => caps.push(c);

  // dramatic open flash
  cfg.impacts.push({ at: 0.1, mag: 8, flash: 0.52, color: A, dur: 0.5 });

  // ---- INTRO CARD (so viewers know exactly what they're watching) ----
  const I = def.intro || {};
  if (I.mode === 'concept') {
    // a concept/teaching card (e.g. "THE 4-MOVE CHECKMATE")
    if (I.kicker) push({ style: 'kicker', text: I.kicker, y: 470, size: 40, color: A, start: 0.5, end: 3.15, inDur: 0.4, outDur: 0.4 });
    push({ style: 'name', text: I.line1 || '', y: 690, size: 118, start: 0.95, end: 3.15, inDur: 0.32, outDur: 0.4 });
    if (I.line2) push({ style: 'name', text: I.line2, y: 890, size: 118, start: 1.25, end: 3.15, inDur: 0.32, outDur: 0.4 });
    if (I.note) push({ style: 'tag', text: I.note, y: 1120, size: 48, start: 1.85, end: 3.15, inDur: 0.4, outDur: 0.4 });
  } else {
    // a player matchup card (WHITE vs BLACK)
    if (I.kicker) push({ style: 'kicker', text: I.kicker, y: 168, size: 40, color: A, start: 0.5, end: 3.15, inDur: 0.4, outDur: 0.4 });
    push({ style: 'kicker', text: 'WHITE', y: 560, size: 30, color: 'rgba(255,255,255,0.45)', start: 0.9, end: 3.15, inDur: 0.3, outDur: 0.4 });
    push({ style: 'name', text: I.white || def.outro.title, y: 668, size: 96, start: 0.95, end: 3.15, inDur: 0.32, outDur: 0.4 });
    push({ style: 'kicker', text: '— versus —', y: 858, size: 34, color: A, start: 1.15, end: 3.15, inDur: 0.3, outDur: 0.4 });
    push({ style: 'kicker', text: 'BLACK', y: 992, size: 30, color: 'rgba(255,255,255,0.45)', start: 1.35, end: 3.15, inDur: 0.3, outDur: 0.4 });
    push({ style: 'name', text: I.black || '', y: 1100, size: 82, start: 1.4, end: 3.15, inDur: 0.32, outDur: 0.4 });
    if (I.note) push({ style: 'tag', text: I.note, y: 1320, size: 46, start: 1.9, end: 3.15, inDur: 0.4, outDur: 0.4 });
  }
  cfg.impacts.push({ at: 0.95, mag: 15, flash: 0.16, color: A, dur: 0.35 });
  cfg.impacts.push({ at: 1.4, mag: 15, flash: 0.16, color: A, dur: 0.35 });

  // ---- CONTEXT during montage ----
  if (def.context) push({ style: 'kicker', text: def.context, y: 150, size: 32, color: A, start: 4.3, end: r2(flurryEnd - 0.1), inDur: 0.5, outDur: 0.5 });

  // ---- escalation beats across the montage (the narrative) ----
  const beats = def.beats || [];
  const bStart = 4.55, bEnd = r2(flurryEnd + 0.05);
  const slot = beats.length ? (bEnd - bStart) / beats.length : 0;
  beats.forEach((txt, i) => {
    const s = r2(bStart + i * slot);
    push({ style: 'line', text: txt, y: 360, size: 74, start: s, end: r2(s + slot - 0.1), inDur: 0.3, outDur: 0.25 });
    cfg.impacts.push({ at: s, mag: 8, dur: 0.3 });
  });

  // ---- bridge card (the fast-forwarded stretch of the game) ----
  if (bridge && gap >= 4) {
    const fullMoves = Math.round(gap / 2);
    const txt = def.bridgeLine || `${fullMoves} moves later…`;
    push({ style: 'kicker', text: txt, y: 352, size: 44, color: A,
           start: r2(bridge.start - 0.1), end: r2(bridge.end + 0.1), inDur: 0.3, outDur: 0.3 });
  }

  // ---- tension ----
  if (def.tension) push({ style: 'line', text: def.tension, y: 360, size: 80, start: r2(cfg.tensionStart + 0.35), end: r2(dropAt - 0.05), inDur: 0.35, outDur: 0.2 });

  // ---- THE DROP ----
  if (drop.line) push({ style: 'line', text: drop.line, y: 360, size: 94, color: A, start: dropAt, end: r2(dropAt + dropDur - 0.05), inDur: 0.28, outDur: 0.25 });
  cfg.impacts.push({ at: dropAt, mag: 16, flash: 0.4, color: A, dur: 0.45 });

  const endWord = def.drop.endWord || 'CHECKMATE';
  push({ style: 'checkmate', text: endWord, y: 372, size: endWord.length > 9 ? 132 : 150, start: r2(dropAt + dropDur - 0.1), end: r2(mateRevealEnd - 0.05), inDur: 0.25, outDur: 0.45 });
  if (def.finishKicker) push({ style: 'kicker', text: def.finishKicker, y: 545, size: 36, color: 'rgba(255,255,255,0.85)', start: r2(dropAt + dropDur + 0.3), end: r2(mateRevealEnd - 0.1), inDur: 0.5, outDur: 0.5 });
  if (def.factKicker) push({ style: 'kicker', text: def.factKicker, y: 1665, size: 33, color: 'rgba(255,255,255,0.8)', start: r2(dropAt + dropDur + 0.5), end: r2(mateRevealEnd - 0.1), inDur: 0.5, outDur: 0.5 });

  // ---- OUTRO (a full OUTRO_SPAN of unhurried hold; nothing pops off early) ----
  const O = def.outro || {};
  push({ style: 'name', text: O.title || '', y: 292, size: 104, start: r2(outroStart + 0.15), end: r2(D - 0.45), inDur: 0.5, outDur: 0.75 });
  if (O.tag) push({ style: 'tag', text: O.tag, y: 470, size: 50, start: r2(outroStart + 0.75), end: r2(D - 0.45), inDur: 0.6, outDur: 0.75 });
  // no ♟ glyph here: the render fonts have no pawn and draw a tofu box
  push({ style: 'kicker', text: 'follow for more', y: 1604, size: 42, color: 'rgba(255,255,255,0.85)', start: r2(outroStart + 1.25), end: r2(D - 0.12), inDur: 0.6, outDur: 0.8 });

  return { cfg, captions: caps, def };
}

const API = { makeStoryboard };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { storygen: API }); }
