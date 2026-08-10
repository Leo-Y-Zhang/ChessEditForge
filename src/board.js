'use strict';
/*
 * board.js — draws the chessboard, coordinates and pieces for a given position,
 * with an optional gliding move, capture fade, square highlights, camera push-in
 * and a toppled losing king. Canvas-2D only (browser + Node identical).
 */
const _pieces = (typeof require !== 'undefined') ? require('./pieces.js')
  : (typeof window !== 'undefined' ? window.CEF.pieces : globalThis.CEF.pieces);

function layout(theme, size) {
  const s = size || 1010;                 // bigger board -> clearer, bigger pieces
  return { bx: (theme.W - s) / 2, by: 604, size: s, cs: s / 8 };
}

// chess.com-style move-quality badges (Brilliant, Great, Blunder, ...)
const BADGE = {
  brilliant: { bg: '#1aa88b', fg: '#ffffff', label: '!!' },
  great: { bg: '#5b8bb0', fg: '#ffffff', label: '!' },
  best: { bg: '#6aa84f', fg: '#ffffff', label: '★' },
  good: { bg: '#7a9b76', fg: '#ffffff', label: '✓' },
  mistake: { bg: '#e0912a', fg: '#ffffff', label: '?' },
  blunder: { bg: '#ca3431', fg: '#ffffff', label: '??' },
  mate: { bg: '#111417', fg: '#e8b64a', label: '#' },
};

function drawBadge(ctx, lo, sqName, type, scale) {
  const b = BADGE[type] || BADGE.brilliant;
  const file = sqName.charCodeAt(0) - 97;
  const row = 8 - Number(sqName[1]);
  const cx = lo.bx + file * lo.cs + lo.cs * 0.82;
  const cy = lo.by + row * lo.cs + lo.cs * 0.18;
  const r = lo.cs * 0.30 * (scale == null ? 1 : scale);
  if (r <= 0) return;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 3;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = b.bg; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.lineWidth = r * 0.12; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
  ctx.fillStyle = b.fg;
  ctx.font = `700 ${Math.round(r * (b.label.length > 1 ? 0.95 : 1.25))}px ${'Bahnschrift, sans-serif'}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(b.label, cx, cy + r * 0.04);
  ctx.restore();
}

function drawShock(ctx, x, y, r, alpha, color) {
  if (alpha <= 0 || r <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = Math.max(3, r * 0.06);
  ctx.strokeStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// Finish effects, drawn in board space (inside the camera transform).
function drawEndFx(ctx, lo, ea, glowSq) {
  if (ea.kind === 'mate') {
    const c = centerOf(lo, ea.sq);
    const lp = (ea.progress - 0.5) / 0.5;   // landing phase (king hits the board)
    if (lp <= 0) return;
    const k = Math.min(1, lp);
    drawShock(ctx, c.x, c.y + lo.cs * 0.18, lo.cs * (0.35 + k * 1.15), (1 - k) * 0.85, '#dc3c32');
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, lo.cs * 1.3);
    g.addColorStop(0, `rgba(216,52,42,${(1 - k) * 0.45})`);
    g.addColorStop(1, 'rgba(216,52,42,0)');
    ctx.fillStyle = g;
    ctx.fillRect(c.x - lo.cs * 1.5, c.y - lo.cs * 1.5, lo.cs * 3, lo.cs * 3);
  } else if (ea.kind === 'resign') {
    // dim the board to a soft spotlight on the brilliant move
    const c = glowSq ? centerOf(lo, glowSq) : { x: lo.bx + lo.size / 2, y: lo.by + lo.size / 2 };
    const dim = ea.progress * 0.62;
    const g = ctx.createRadialGradient(c.x, c.y, lo.cs * 0.5, c.x, c.y, lo.size * 0.8);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(4,6,10,${dim})`);
    ctx.fillStyle = g;
    ctx.fillRect(lo.bx - 60, lo.by - 60, lo.size + 120, lo.size + 120);
  }
}

function centerOf(lo, sqName) {
  const file = sqName.charCodeAt(0) - 97;
  const rank = Number(sqName[1]);
  const row = 8 - rank;
  return { x: lo.bx + file * lo.cs + lo.cs / 2, y: lo.by + row * lo.cs + lo.cs / 2 };
}

function drawFrame(ctx, lo, theme) {
  const m = 22;
  // outer gold frame with bevel
  const g = ctx.createLinearGradient(0, lo.by - m, 0, lo.by + lo.size + m);
  g.addColorStop(0, theme.board.frame);
  g.addColorStop(1, theme.board.frameDark);
  ctx.fillStyle = g;
  roundRect(ctx, lo.bx - m, lo.by - m, lo.size + m * 2, lo.size + m * 2, 16);
  ctx.fill();
  ctx.fillStyle = '#05070b';
  roundRect(ctx, lo.bx - 6, lo.by - 6, lo.size + 12, lo.size + 12, 8);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSquares(ctx, lo, theme, highlight) {
  for (let i = 0; i < 64; i++) {
    const row = i >> 3, file = i % 8;
    const x = lo.bx + file * lo.cs, y = lo.by + row * lo.cs;
    ctx.fillStyle = (row + file) % 2 === 0 ? theme.board.light : theme.board.dark;
    ctx.fillRect(x, y, lo.cs, lo.cs);
  }
  if (highlight) {
    for (const [sqName, col] of highlight) {
      const file = sqName.charCodeAt(0) - 97;
      const row = 8 - Number(sqName[1]);
      ctx.fillStyle = col;
      ctx.fillRect(lo.bx + file * lo.cs, lo.by + row * lo.cs, lo.cs, lo.cs);
    }
  }
}

function drawCoords(ctx, lo, theme) {
  ctx.fillStyle = theme.board.coord;
  ctx.font = `600 ${Math.round(lo.cs * 0.16)}px ${theme.fonts.head}`;
  ctx.textBaseline = 'alphabetic';
  for (let f = 0; f < 8; f++) {
    ctx.textAlign = 'left';
    ctx.fillText(String.fromCharCode(97 + f), lo.bx + f * lo.cs + 6, lo.by + lo.size - 8);
  }
  for (let r = 0; r < 8; r++) {
    ctx.textAlign = 'right';
    ctx.fillText(String(8 - r), lo.bx + lo.size - 8, lo.by + r * lo.cs + lo.cs * 0.22);
  }
  ctx.textAlign = 'left';
}

// opts: { move:{from,to,side,progress}, highlight:[[sq,color]], glowSq, toppleSq,
//         camera:{zoom, fx, fy, shakeX, shakeY} }
function drawBoard(ctx, position, theme, opts) {
  opts = opts || {};
  const lo = opts.layout || layout(theme);
  const cam = opts.camera;

  ctx.save();
  if (cam) {
    const cx = cam.fx == null ? theme.W / 2 : cam.fx;
    const cy = cam.fy == null ? lo.by + lo.size / 2 : cam.fy;
    ctx.translate((cam.shakeX || 0), (cam.shakeY || 0));
    ctx.translate(cx, cy);
    ctx.scale(cam.zoom || 1, cam.zoom || 1);
    ctx.translate(-cx, -cy);
  }

  drawFrame(ctx, lo, theme);
  drawSquares(ctx, lo, theme, opts.highlight);
  drawCoords(ctx, lo, theme);

  // winning-square glow (e.g. the checkmate square)
  if (opts.glowSq) {
    const c = centerOf(lo, opts.glowSq);
    const rad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, lo.cs * 1.4);
    rad.addColorStop(0, 'rgba(232,182,74,0.55)');
    rad.addColorStop(1, 'rgba(232,182,74,0)');
    ctx.fillStyle = rad;
    ctx.fillRect(c.x - lo.cs * 1.6, c.y - lo.cs * 1.6, lo.cs * 3.2, lo.cs * 3.2);
  }

  const skipFrom = opts.move ? opts.move.from : null;
  const captureSq = opts.move && opts.move.progress < 1 ? opts.move.to : null;

  for (let i = 0; i < 64; i++) {
    const p = position[i];
    if (!p) continue;
    const sqName = String.fromCharCode(97 + (i % 8)) + (8 - (i >> 3));
    if (sqName === skipFrom) continue;
    const isWhite = p === p.toUpperCase();
    const type = p.toUpperCase();
    const c = centerOf(lo, sqName);
    let o = {};
    if (opts.endAnim && opts.endAnim.sq === sqName) {
      o.topple = opts.endAnim.progress; o.toppleKind = opts.endAnim.kind;
      // a struck-down mate king glows so it pops as it falls (dark king on a
      // dark square would otherwise vanish); a resigning king stays in shadow.
      if (opts.endAnim.kind === 'mate') o.glow = 'rgba(230,78,60,0.92)';
    }
    if (sqName === captureSq) {
      ctx.save();
      ctx.globalAlpha = 1 - opts.move.progress;
      _pieces.drawPiece(ctx, type, isWhite, c.x, c.y, lo.cs, theme, o);
      ctx.restore();
      continue;
    }
    _pieces.drawPiece(ctx, type, isWhite, c.x, c.y, lo.cs, theme, o);
  }

  // gliding piece
  if (opts.move) {
    const mv = opts.move;
    const a = centerOf(lo, mv.from), b = centerOf(lo, mv.to);
    const t = mv.ease == null ? mv.progress : mv.ease;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    const piece = mv.piece;
    const isWhite = piece === piece.toUpperCase();
    const lift = Math.sin(Math.min(t, 1) * Math.PI) * lo.cs * 0.12;
    // landing impact shockwave (bigger for a "big" move)
    const prog = mv.progress;
    if (prog > 0.7) {
      const k = (prog - 0.7) / 0.3;
      const big = mv.big ? 2.0 : 1.0;
      drawShock(ctx, b.x, b.y, lo.cs * (0.28 + k * 0.9 * big), (1 - k) * (mv.big ? 0.75 : 0.4),
        mv.glow || theme.accent);
    }
    _pieces.drawPiece(ctx, piece.toUpperCase(), isWhite, x, y - lift, lo.cs, theme,
      { glow: mv.glow });
  }

  // end-of-edit finish effects (impact shock for a mate; spotlight dim for a resign)
  if (opts.endAnim) drawEndFx(ctx, lo, opts.endAnim, opts.glowSq);

  // move-quality badges (chess.com style), on top of everything, in board space
  if (opts.badges) {
    for (const bd of opts.badges) drawBadge(ctx, lo, bd.sq, bd.type, bd.scale);
  }

  ctx.restore();
}

const API = { layout, centerOf, drawBoard };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { board: API }); }
