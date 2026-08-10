'use strict';
/*
 * fx.js — cinematic full-frame effects: background, vignette, film grain,
 * letterbox bars and flash. Canvas-2D only; the caller supplies a canvas
 * factory once so grain works in both the browser and Node.
 */

function drawBackground(ctx, theme, t) {
  const g = ctx.createLinearGradient(0, 0, 0, theme.H);
  g.addColorStop(0, theme.bg.top);
  g.addColorStop(0.5, theme.bg.mid);
  g.addColorStop(1, theme.bg.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, theme.W, theme.H);

  // slow breathing radial glow behind the board
  const pulse = 0.5 + 0.5 * Math.sin(t * 0.6);
  const cx = theme.W / 2, cy = theme.H * 0.56;
  const rad = ctx.createRadialGradient(cx, cy, 0, cx, cy, theme.W * (0.9 + pulse * 0.1));
  rad.addColorStop(0, theme.bg.glow);
  rad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, theme.W, theme.H);
}

function vignette(ctx, theme, strength) {
  const s = strength == null ? 0.9 : strength;
  const cx = theme.W / 2, cy = theme.H / 2;
  const rad = ctx.createRadialGradient(cx, cy, theme.H * 0.28, cx, cy, theme.H * 0.62);
  rad.addColorStop(0, 'rgba(0,0,0,0)');
  rad.addColorStop(1, `rgba(0,0,0,${s})`);
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, theme.W, theme.H);
}

function makeNoise(createCanvasFn, size) {
  size = size || 256;
  const cv = createCanvasFn(size, size);
  const c = cv.getContext('2d');
  const img = c.createImageData(size, size);
  const d = img.data;
  // deterministic-ish noise (seeded LCG so renders are reproducible)
  let seed = 1234567;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < d.length; i += 4) {
    const v = 120 + Math.floor(rnd() * 135);
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = Math.floor(rnd() * 90);
  }
  c.putImageData(img, 0, 0);
  return cv;
}

function drawGrain(ctx, noise, theme, frame, alpha) {
  if (!noise) return;
  const size = noise.width;
  const ox = (frame * 57) % size;
  const oy = (frame * 131) % size;
  ctx.save();
  ctx.globalAlpha = alpha == null ? 0.06 : alpha;
  ctx.globalCompositeOperation = 'overlay';
  for (let x = -ox; x < theme.W; x += size) {
    for (let y = -oy; y < theme.H; y += size) {
      ctx.drawImage(noise, x, y);
    }
  }
  ctx.restore();
}

function letterbox(ctx, theme, h) {
  if (!h) return;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, theme.W, h);
  ctx.fillRect(0, theme.H - h, theme.W, h);
}

function flash(ctx, theme, alpha, color) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(alpha, 1);
  ctx.fillStyle = color || '#ffffff';
  ctx.fillRect(0, 0, theme.W, theme.H);
  ctx.restore();
}

const API = { drawBackground, vignette, makeNoise, drawGrain, letterbox, flash };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { fx: API }); }
