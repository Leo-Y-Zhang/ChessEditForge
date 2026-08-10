'use strict';
/*
 * pieces.js — chess pieces drawn as vector silhouettes in a 1000x1000 grid.
 * Font/asset free, so they render identically in the browser and in the Node
 * video render. drawPiece() fills a clean silhouette + rim, in the given colors.
 */

function rr(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
}
function ell(ctx, cx, cy, rx, ry) {
  ctx.moveTo(cx + rx, cy);
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
}

// Each builder appends sub-paths to the current path (in the 1000 grid).
const SHAPE = {
  P(ctx) {
    rr(ctx, 300, 812, 400, 96, 40);            // base
    ctx.moveTo(415, 812);                       // body (neck)
    ctx.bezierCurveTo(430, 700, 430, 620, 470, 560);
    ctx.lineTo(530, 560);
    ctx.bezierCurveTo(570, 620, 570, 700, 585, 812);
    ctx.closePath();
    rr(ctx, 398, 528, 204, 52, 26);            // collar
    ell(ctx, 500, 430, 118, 118);              // head
  },
  R(ctx) {
    rr(ctx, 288, 812, 424, 96, 40);            // base
    ctx.moveTo(360, 812);                       // body
    ctx.bezierCurveTo(352, 700, 352, 560, 372, 470);
    ctx.lineTo(628, 470);
    ctx.bezierCurveTo(648, 560, 648, 700, 640, 812);
    ctx.closePath();
    rr(ctx, 330, 424, 340, 58, 12);            // shoulder band
    // crenellations
    rr(ctx, 330, 300, 96, 130, 6);
    rr(ctx, 452, 300, 96, 130, 6);
    rr(ctx, 574, 300, 96, 130, 6);
    rr(ctx, 330, 388, 340, 44, 6);
  },
  B(ctx) {
    rr(ctx, 300, 812, 400, 96, 40);            // base
    rr(ctx, 366, 756, 268, 60, 26);            // collar
    ctx.moveTo(500, 168);                       // mitre body
    ctx.bezierCurveTo(636, 300, 660, 520, 610, 700);
    ctx.bezierCurveTo(596, 742, 560, 760, 500, 760);
    ctx.bezierCurveTo(440, 760, 404, 742, 390, 700);
    ctx.bezierCurveTo(340, 520, 364, 300, 500, 168);
    ctx.closePath();
    ell(ctx, 500, 150, 52, 52);                // top ball
  },
  Q(ctx) {
    rr(ctx, 280, 826, 440, 92, 40);            // base
    rr(ctx, 344, 770, 312, 60, 26);            // collar
    ctx.moveTo(360, 770);                       // bell body
    ctx.bezierCurveTo(392, 640, 420, 520, 400, 420);
    ctx.lineTo(600, 420);
    ctx.bezierCurveTo(580, 520, 608, 640, 640, 770);
    ctx.closePath();
    // crown: five spikes down to a band
    const tips = [372, 436, 500, 564, 628];
    ctx.moveTo(360, 430);
    for (const x of tips) { ctx.lineTo(x, 236); ctx.lineTo(x + 32, 430); }
    ctx.lineTo(640, 430);
    ctx.closePath();
    for (const x of tips) ell(ctx, x + 16, 224, 40, 40); // balls on tips
  },
  K(ctx) {
    rr(ctx, 280, 826, 440, 92, 40);            // base
    rr(ctx, 344, 770, 312, 60, 26);            // collar
    ctx.moveTo(360, 770);                       // bell body
    ctx.bezierCurveTo(392, 640, 420, 520, 400, 430);
    ctx.lineTo(600, 430);
    ctx.bezierCurveTo(580, 520, 608, 640, 640, 770);
    ctx.closePath();
    rr(ctx, 374, 336, 252, 100, 14);           // crown band
    rr(ctx, 470, 150, 60, 200, 8);             // cross vertical
    rr(ctx, 410, 206, 180, 58, 8);             // cross horizontal
  },
  N(ctx) {
    rr(ctx, 292, 828, 416, 92, 40);            // base
    rr(ctx, 330, 792, 340, 46, 16);            // pedestal step
    // Modern VECTOR knight: a sleek icon-like silhouette — near-straight
    // nose-bridge diagonal, flat nose front, a deep V-notch under the jaw
    // separating head from chest, tight paired ears, and one smooth crest
    // sweep from the ears down to the base.
    ctx.moveTo(408, 800);                              // front of neck at the step
    ctx.bezierCurveTo(400, 700, 386, 640, 364, 592);   // chest rises
    ctx.lineTo(350, 520);                              // crisp V-notch down (sharp chevron)
    ctx.lineTo(302, 500);                              // crisp V-notch up (sharp chevron)
    ctx.lineTo(262, 504);                              // clean jawline to muzzle base
    ctx.lineTo(216, 456);                              // squared muzzle corner (hard angle)
    ctx.lineTo(208, 404);                              // flat modern nose front
    ctx.bezierCurveTo(252, 360, 330, 300, 426, 248);   // straight nose-bridge diagonal
    ctx.bezierCurveTo(436, 244, 442, 242, 446, 240);   // brow step
    ctx.bezierCurveTo(458, 200, 476, 156, 500, 128);   // front ear up (sleek)
    ctx.bezierCurveTo(524, 152, 534, 180, 540, 210);   // front ear down
    ctx.bezierCurveTo(544, 208, 548, 206, 552, 202);   // tight valley
    ctx.bezierCurveTo(560, 176, 572, 148, 588, 132);   // back ear up
    ctx.bezierCurveTo(610, 160, 618, 190, 622, 218);   // back ear down
    ctx.bezierCurveTo(640, 250, 656, 280, 672, 318);   // skull into the crest
    ctx.bezierCurveTo(712, 400, 716, 520, 688, 640);   // one smooth crest sweep
    ctx.bezierCurveTo(672, 716, 652, 768, 640, 800);   // settles onto the step
    ctx.closePath();
  },
};

// Accent marks (eye, mane ridge, mitre slit) drawn in detail color after the
// silhouette. Each draws itself; fill/stroke styles are pre-set to the color.
const DETAIL = {
  N(ctx) {
    ctx.beginPath();                                   // sleek teardrop eye
    ctx.ellipse(408, 300, 22, 12, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();                                   // single mane sweep
    ctx.moveTo(588, 290);
    ctx.bezierCurveTo(642, 390, 650, 520, 612, 690);
    ctx.lineWidth = 20;
    ctx.stroke();
  },
  B(ctx) {
    ctx.beginPath();                                   // mitre slit
    ctx.moveTo(470, 300);
    ctx.lineTo(560, 420);
    ctx.lineWidth = 26;
    ctx.stroke();
  },
};

const _outBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const _outCubic = (t) => 1 - Math.pow(1 - t, 3);

function drawPiece(ctx, type, isWhite, cx, cy, cell, theme, opts) {
  opts = opts || {};
  const s = cell * 0.95;
  const fill = isWhite ? theme.piece.white : theme.piece.black;
  const rim = isWhite ? theme.piece.whiteRim : theme.piece.blackRim;
  const detail = isWhite ? theme.piece.whiteDetail : theme.piece.blackDetail;

  ctx.save();
  ctx.translate(cx, cy + cell * 0.02);
  if (opts.topple != null) {
    // a king toppling — pivot about its BASE so it falls over believably.
    // mate = a fast fall with a little overshoot; resign = a slow, soft lay-down.
    const p = opts.topple < 0 ? 0 : opts.topple > 1 ? 1 : opts.topple;
    const soft = opts.toppleKind === 'resign';
    const angle = soft ? _outCubic(p) * 1.4 : _outBack(p) * 1.5;
    const baseY = cell * 0.38;
    ctx.translate(0, baseY);
    ctx.rotate(angle);
    ctx.translate(0, -baseY);
    if (soft) ctx.globalAlpha *= 1 - 0.35 * p;   // recede into the shadow
  } else if (opts.rotate) {
    ctx.rotate(opts.rotate);
  }
  if (opts.scale) ctx.scale(opts.scale, opts.scale);
  ctx.translate(-s / 2, -s / 2);
  ctx.scale(s / 1000, s / 1000);

  // soft contact shadow
  ctx.save();
  ctx.fillStyle = theme.piece.shadow;
  ctx.beginPath();
  ell(ctx, 500, 900, 260, 46);
  ctx.fill();
  ctx.restore();

  // silhouette
  ctx.beginPath();
  SHAPE[type](ctx);
  if (opts.glow) { ctx.shadowColor = opts.glow; ctx.shadowBlur = 60; }
  ctx.fillStyle = fill;
  ctx.fill('nonzero');
  ctx.shadowBlur = 0;

  // rim outline for definition
  ctx.beginPath();
  SHAPE[type](ctx);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 16;
  ctx.strokeStyle = rim;
  ctx.globalAlpha = isWhite ? 0.85 : 0.9;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // accents
  if (DETAIL[type]) {
    ctx.save();
    ctx.fillStyle = detail;
    ctx.strokeStyle = detail;
    ctx.lineCap = 'round';
    DETAIL[type](ctx);
    ctx.restore();
  }
  ctx.restore();
}

const API = { drawPiece };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { pieces: API }); }
