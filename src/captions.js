'use strict';
/*
 * captions.js — kinetic typography drawn on the canvas. Each style is a small
 * renderer keyed by cap.style. All copy is supplied by the storyboard; this
 * module only knows how to make text move.
 */
const _E = (typeof require !== 'undefined') ? require('./engine.js')
  : (typeof window !== 'undefined' ? window.CEF.engine : globalThis.CEF.engine);
const ease = _E.ease;

function trackedText(ctx, text, x, y, spacing, align) {
  const widths = [];
  let total = 0;
  for (const ch of text) { const w = ctx.measureText(ch).width; widths.push(w); total += w + spacing; }
  total -= spacing;
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.textAlign = 'left';
  let i = 0;
  for (const ch of text) { ctx.fillText(ch, cx, y); cx += widths[i++] + spacing; }
  return total;
}

// Widest a caption may draw; everything scales down to fit inside the frame.
const SAFE_W = 1044;

function trackedWidth(ctx, text, spacing) {
  let total = -spacing;
  for (const ch of text) total += ctx.measureText(ch).width + spacing;
  return total;
}

// Uniform shrink factor so `text` (already-set font) fits SAFE_W. A caption
// can never overflow the frame; the fit test keeps copy short enough that
// this stays a subtle safety net, never a visible squeeze.
function fitScale(ctx, text, spacing) {
  const w = trackedWidth(ctx, text, spacing);
  return w > SAFE_W ? SAFE_W / w : 1;
}

// style renderers ------------------------------------------------------------
const STYLES = {
  kicker(ctx, cap, st, theme) {
    const y = cap.y + (1 - st.enter) * 18;
    ctx.globalAlpha = st.opacity;
    ctx.fillStyle = cap.color || theme.text.dim;
    ctx.font = `600 ${cap.size || 34}px ${theme.fonts.head}`;
    ctx.textBaseline = 'middle';
    const text = cap.text.toUpperCase();
    const track = cap.track || 10;
    const s = fitScale(ctx, text, track);
    ctx.save();
    ctx.translate(theme.W / 2, y);
    ctx.scale(s, s);
    trackedText(ctx, text, 0, 0, track, 'center');
    ctx.restore();
    ctx.globalAlpha = 1;
  },

  name(ctx, cap, st, theme) {
    // slam-in: overscale + settle with a little overshoot
    const e = ease.outBack(st.enter);
    const scale = 1.6 - 0.6 * ease.outCubic(st.enter);
    ctx.save();
    ctx.globalAlpha = st.opacity;
    ctx.translate(theme.W / 2, cap.y);
    ctx.fillStyle = cap.color || theme.text.primary;
    ctx.font = `${cap.size || 172}px ${theme.fonts.display}`;
    const text = cap.text.toUpperCase();
    const track = cap.track || 6;
    const fit = fitScale(ctx, text, track);   // resting width always fits
    ctx.scale(scale * fit, scale * fit);
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
    trackedText(ctx, text, 0, 0, track, 'center');
    ctx.restore();
    ctx.globalAlpha = 1;
    void e;
  },

  stat(ctx, cap, st, theme) {
    const rise = (1 - ease.outCubic(st.enter)) * 40;
    ctx.save();
    ctx.globalAlpha = st.opacity;
    ctx.translate(0, rise);
    // accent bar
    ctx.fillStyle = theme.accent;
    ctx.fillRect(theme.W / 2 - 40, cap.y - cap.size * 0.72, 80, 6);
    // big value
    ctx.fillStyle = cap.color || theme.text.primary;
    ctx.font = `${cap.size || 108}px ${theme.fonts.display}`;
    ctx.textBaseline = 'alphabetic';
    trackedText(ctx, cap.text.toUpperCase(), theme.W / 2, cap.y, cap.track || 2, 'center');
    // sub label
    if (cap.sub) {
      ctx.fillStyle = theme.text.dim;
      ctx.font = `600 ${cap.subSize || 36}px ${theme.fonts.head}`;
      ctx.textBaseline = 'middle';
      trackedText(ctx, cap.sub.toUpperCase(), theme.W / 2, cap.y + 44, 8, 'center');
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  },

  line(ctx, cap, st, theme) {
    const rise = (1 - ease.outCubic(st.enter)) * 34;
    ctx.globalAlpha = st.opacity;
    ctx.fillStyle = cap.color || theme.text.primary;
    ctx.font = `${cap.size || 76}px ${theme.fonts.display}`;
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 24;
    const text = cap.text.toUpperCase();
    const track = cap.track || 3;
    const s = fitScale(ctx, text, track);
    ctx.save();
    ctx.translate(theme.W / 2, cap.y + rise);
    ctx.scale(s, s);
    trackedText(ctx, text, 0, 0, track, 'center');
    ctx.restore();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  },

  checkmate(ctx, cap, st, theme) {
    const pop = ease.outBack(Math.min(st.enter * 1.2, 1));
    const scale = 0.7 + 0.3 * pop;
    ctx.save();
    ctx.globalAlpha = st.opacity;
    ctx.translate(theme.W / 2, cap.y);
    ctx.font = `${cap.size || 150}px ${theme.fonts.display}`;
    const fit = fitScale(ctx, cap.text || 'CHECKMATE', 4);
    ctx.scale(scale * fit, scale * fit);
    ctx.textBaseline = 'middle';
    // red glow behind
    const word = cap.text || 'CHECKMATE';
    ctx.shadowColor = theme.danger; ctx.shadowBlur = 50;
    ctx.fillStyle = theme.danger;
    trackedText(ctx, word, 0, 0, 4, 'center');
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    trackedText(ctx, word, 0, 0, 4, 'center');
    ctx.restore();
    ctx.globalAlpha = 1;
  },

  tag(ctx, cap, st, theme) {
    ctx.globalAlpha = st.opacity;
    ctx.fillStyle = cap.color || theme.accent;
    ctx.font = `italic ${cap.size || 46}px ${theme.fonts.body}`;
    ctx.textBaseline = 'middle';
    const s = fitScale(ctx, cap.text, 0);
    ctx.save();
    ctx.translate(theme.W / 2, cap.y + (1 - st.enter) * 16);
    ctx.scale(s, s);
    ctx.textAlign = 'center';
    ctx.fillText(cap.text, 0, 0);
    ctx.restore();
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  },
};

function drawCaptions(ctx, captions, t, theme) {
  const live = _E.activeCaptions(captions, t);
  for (const item of live) {
    const fn = STYLES[item.cap.style] || STYLES.line;
    ctx.save();
    fn(ctx, item.cap, item, theme);
    ctx.restore();
  }
}

const API = { drawCaptions, trackedText, STYLES };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { captions: API }); }
