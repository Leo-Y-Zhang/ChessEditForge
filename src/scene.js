'use strict';
/*
 * scene.js — the director. Given a time t (and prebuilt deps), it composites one
 * full frame: background, board (with camera + move glide), effects and captions.
 * Pure drawing against a canvas-2D context; used by both the Node renderer and
 * the in-browser player.
 */
function _req(name) {
  if (typeof require !== 'undefined') return require('./' + name + '.js');
  const g = (typeof window !== 'undefined' ? window : globalThis).CEF;
  return g[name];
}
const chess = _req('chess');
const engine = _req('engine');
const board = _req('board');
const pieces = _req('pieces');
const captions = _req('captions');
const fx = _req('fx');
const ease = engine.ease;

function smooth(t, a, b) {
  if (t <= a) return 0;
  if (t >= b) return 1;
  return ease.inOutCubic((t - a) / (b - a));
}
function decay(t, at, dur) {
  if (t < at || t > at + dur) return 0;
  return 1 - (t - at) / dur;
}
function endProg(t, start, dur) { return ease.clamp01((t - start) / dur); }
// The resigning side is the one NOT delivering the final move; find its king.
function findLosingKingSq(pos, winnerSide) {
  const loser = winnerSide === 'w' ? 'k' : 'K';
  for (let i = 0; i < 64; i++) if (pos[i] === loser) return chess.name(i);
  return null;
}

function computeBoardState(t, cfg, positions, moves, theme) {
  const H = theme.board;
  // The "drop" plays plies dropFromPly..dropToPly (one move for a single-move
  // mate, several for a sacrifice->mate finish). Back-compatible with dropPly.
  const dropFrom = cfg.dropFromPly != null ? cfg.dropFromPly : cfg.dropPly;
  const dropTo = cfg.dropToPly != null ? cfg.dropToPly : cfg.dropPly;
  const prePly = cfg.prePly != null ? cfg.prePly : dropFrom - 1;
  const lastMv = moves[dropTo];

  const posBefore = (i) => (i < 0 ? chess.startPosition() : positions[i]);
  if (t < cfg.settleAt) {
    if (t < cfg.flurryStart) return { position: posBefore(cfg.flurryFromPly - 1) };
    if (t <= cfg.flurryEnd) {
      const { ply, progress } = engine.plyAt(cfg, t);
      const prePos = posBefore(ply - 1);
      const mv = moves[ply];
      return {
        position: prePos,
        move: { from: mv.from, to: mv.to, piece: prePos[chess.sq(mv.from)],
                progress, ease: ease.inOutCubic(progress) },
        highlight: [[mv.from, H.lastFrom], [mv.to, H.lastTo]],
      };
    }
    return { position: positions[cfg.flurryToPly] };
  }
  if (t < cfg.dropAt) {
    // BRIDGE: fast-forward the moves between the montage and the finish so the
    // board never teleports — every ply is shown, just quickly.
    if (cfg.bridgeStart != null && t >= cfg.bridgeStart) {
      if (t < cfg.bridgeEnd) {
        const n = cfg.bridgeToPly - cfg.bridgeFromPly + 1;
        const pos = ((t - cfg.bridgeStart) / (cfg.bridgeEnd - cfg.bridgeStart)) * n;
        let idx = Math.floor(pos); if (idx >= n) idx = n - 1;
        const ply = cfg.bridgeFromPly + idx;
        const progress = ease.clamp01((pos - idx) / 0.62);
        const prePos = posBefore(ply - 1);
        const mv = moves[ply];
        return {
          position: prePos,
          move: { from: mv.from, to: mv.to, piece: prePos[chess.sq(mv.from)],
                  progress, ease: ease.outCubic(progress) },
          highlight: [[mv.from, H.lastFrom], [mv.to, H.lastTo]],
        };
      }
      // bridge done: sit on the position just before the finish
    } else if (cfg.bridgeStart != null) {
      // between the montage settling and the bridge starting
      return { position: positions[cfg.flurryToPly] };
    }
    const sh = cfg.settleHighlight
      || (moves[dropFrom - 1] ? [moves[dropFrom - 1].from, moves[dropFrom - 1].to] : null);
    return { position: posBefore(prePly),
             highlight: sh ? [[sh[0], H.lastFrom], [sh[1], H.lastTo]] : undefined };
  }
  if (t < cfg.dropAt + cfg.dropDur) {
    // weighted dropSchedule when present (the final move holds longest),
    // else equal slots
    let ply, progress;
    if (cfg.dropSchedule && cfg.dropSchedule.length) {
      let slot = cfg.dropSchedule[0];
      for (const s of cfg.dropSchedule) { if (t >= s.start) slot = s; else break; }
      ply = slot.ply;
      // glide over the first 55% of the slot, then HOLD the landed move —
      // the held beat is what makes the big moves feel weighty
      const slotFrac = ease.clamp01((t - slot.start) / (slot.end - slot.start || 1e-6));
      progress = ease.clamp01(slotFrac / 0.55);
    } else {
      const n = dropTo - dropFrom + 1;
      const frac = (t - cfg.dropAt) / cfg.dropDur;
      let pos = frac * n; let idx = Math.floor(pos); if (idx >= n) idx = n - 1;
      ply = dropFrom + idx; progress = pos - idx;
    }
    const prePos = posBefore(ply - 1);
    const mv = moves[ply];
    return {
      position: prePos,
      move: { from: mv.from, to: mv.to, piece: prePos[chess.sq(mv.from)],
              progress, ease: ease.outCubic(progress), glow: theme.accent, big: true },
      highlight: [[mv.from, H.lastFrom], [mv.to, H.lastTo]],
    };
  }
  // ---- the ending animation ----
  // checkmate: the mated king topples (violent). resignation: the LOSING king
  // topples softly and the board dims to a spotlight on the brilliant move.
  const endStart = cfg.dropAt + cfg.dropDur;
  let endAnim = null;
  if (cfg.mateKingSq) {
    endAnim = { sq: cfg.mateKingSq, kind: 'mate', progress: endProg(t, endStart + 0.1, 0.75) };
  } else if (cfg.resign) {
    const sq = findLosingKingSq(positions[dropTo], moves[dropTo].side);
    if (sq) endAnim = { sq, kind: 'resign', progress: endProg(t, endStart + 0.2, 1.3) };
  }
  return { position: positions[dropTo],
           highlight: [[lastMv.from, H.lastFrom], [lastMv.to, H.lastTo]],
           glowSq: cfg.glowSq || lastMv.to, endAnim };
}

function activeBadges(cfg, t) {
  if (!cfg.badges) return null;
  const out = [];
  for (const b of cfg.badges) {
    const dur = b.dur || 1.9;
    if (t < b.at || t > b.at + dur) continue;
    const inP = ease.outBack(ease.clamp01((t - b.at) / 0.26));
    const outP = 1 - ease.clamp01((t - (b.at + dur - 0.25)) / 0.25);
    const scale = Math.max(0, inP * outP);
    if (scale > 0) out.push({ sq: b.sq, type: b.type, scale });
  }
  return out.length ? out : null;
}

function computeCamera(t, cfg, theme) {
  const lo = board.layout(theme);
  const focus = board.centerOf(lo, cfg.focusSq);
  const cx = theme.W / 2, cy = lo.by + lo.size / 2;
  const push = smooth(t, cfg.tensionStart, cfg.dropAt);
  const pull = smooth(t, cfg.mateRevealStart, cfg.mateRevealEnd);
  let zoom = 1 + 0.34 * push - 0.28 * pull;
  if (zoom < 1) zoom = 1;
  // per-move zoom "punch" during the montage — peaks as each move lands, then
  // relaxes on the hold, giving intensity to every move (not just the finish).
  if (t >= cfg.flurryStart && t <= cfg.flurryEnd) {
    const { slotFrac } = engine.plyAt(cfg, t);
    const glide = cfg.montageGlide != null ? cfg.montageGlide : 0.58;
    const pulse = slotFrac < glide ? (slotFrac / glide) : 1 - (slotFrac - glide) / (1 - glide);
    zoom += ease.outCubic(Math.max(0, pulse)) * 0.05;
  }
  const fb = push * (1 - pull);
  let shakeX = 3 * Math.sin(t * 1.3), shakeY = 2 * Math.sin(t * 0.9); // handheld drift
  const amp = 30 * decay(t, cfg.dropAt, 0.6);
  shakeX += amp * Math.sin(t * 90);
  shakeY += amp * Math.cos(t * 77);
  // scripted dramatic impacts (screen shake) from the storyboard
  if (cfg.impacts) {
    for (const im of cfg.impacts) {
      const a = (im.mag || 0) * decay(t, im.at, im.dur || 0.4);
      if (a) { shakeX += a * Math.sin(t * 88 + im.at * 7); shakeY += a * Math.cos(t * 73 + im.at * 5); }
    }
  }
  return { zoom, fx: cx + (focus.x - cx) * fb, fy: cy + (focus.y - cy) * fb, shakeX, shakeY };
}

function drawColdKing(ctx, t, cfg, theme) {
  const appear = ease.outCubic(ease.clamp01(t / 1.0));
  const fade = 1 - ease.clamp01((t - (cfg.coldEnd - 0.6)) / 0.6);
  const cx = theme.W / 2, cy = 980;
  ctx.save();
  ctx.globalAlpha = appear * fade;
  const rad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 440);
  rad.addColorStop(0, 'rgba(232,182,74,0.32)');
  rad.addColorStop(1, 'rgba(232,182,74,0)');
  ctx.fillStyle = rad;
  ctx.fillRect(cx - 480, cy - 480, 960, 960);
  pieces.drawPiece(ctx, cfg.coldPiece || 'K', true, cx, cy, 380, theme, { glow: theme.accent, scale: 0.82 + 0.18 * appear });
  ctx.restore();
}

function drawWatermark(ctx, theme, brand) {
  if (!brand || !brand.handle) return;
  ctx.save();
  ctx.globalAlpha = 0.36;
  ctx.fillStyle = theme.text.primary;
  ctx.font = `600 30px ${theme.fonts.head}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  captions.trackedText(ctx, brand.handle, theme.W / 2, 78, 4, 'center');
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawFrame(ctx, t, deps) {
  const { theme, story, positions, moves, noise } = deps;
  const cfg = story.cfg;
  const frame = Math.round(t * theme.fps);

  fx.drawBackground(ctx, theme, t);

  if (t < cfg.coldEnd) drawColdKing(ctx, t, cfg, theme);

  if (t >= cfg.boardFadeStart) {
    const bs = computeBoardState(t, cfg, positions, moves, theme);
    const cam = computeCamera(t, cfg, theme);
    const op = ease.clamp01((t - cfg.boardFadeStart) / (cfg.boardFadeEnd - cfg.boardFadeStart));
    ctx.save();
    ctx.globalAlpha = op;
    board.drawBoard(ctx, bs.position, theme, {
      camera: cam, move: bs.move, highlight: bs.highlight,
      glowSq: bs.glowSq, endAnim: bs.endAnim, badges: activeBadges(cfg, t),
    });
    ctx.restore();
  }

  const vb = cfg.vignetteBase != null ? cfg.vignetteBase : 0.55;
  const vm = cfg.vignetteMax != null ? cfg.vignetteMax : 0.95;
  const vig = Math.min(vb + (vm - vb) * smooth(t, cfg.tensionStart, cfg.dropAt), vm);
  fx.vignette(ctx, theme, vig);

  const lb = 78 * (smooth(t, cfg.tensionStart, cfg.tensionStart + 0.7)
                   - smooth(t, cfg.fadeStart - 0.4, cfg.fadeStart + 0.3));
  fx.letterbox(ctx, theme, Math.max(0, lb));

  let fl = Math.max(0.5 * decay(t, cfg.settleAt, 0.22),
                    (cfg.dropFlash === false ? 0 : 0.9) * decay(t, cfg.dropAt, 0.3));
  fx.flash(ctx, theme, fl);
  if (cfg.impacts) {
    for (const im of cfg.impacts) {
      if (im.flash) fx.flash(ctx, theme, im.flash * decay(t, im.at, im.flashDur || im.dur || 0.25), im.color);
    }
  }

  captions.drawCaptions(ctx, story.captions, t, theme);
  drawWatermark(ctx, theme, deps.brand);

  fx.drawGrain(ctx, noise, theme, frame, cfg.grainAmount != null ? cfg.grainAmount : 0.05);

  const dur = cfg.duration != null ? cfg.duration : theme.duration;
  const fade = ease.clamp01((t - cfg.fadeStart) / (dur - cfg.fadeStart));
  if (fade > 0) {
    ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, theme.W, theme.H); ctx.restore();
  }
}

const API = { drawFrame, computeBoardState, computeCamera };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { scene: API }); }
