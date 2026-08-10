'use strict';
/*
 * engine.js — pure timeline math shared by the browser player and the Node
 * renderer. No canvas or DOM here: given the storyboard config and a time t,
 * it answers "what should be on screen?".
 */

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const lerp = (a, b, t) => a + (b - a) * t;

const ease = {
  clamp01,
  lerp,
  linear: (t) => t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inCubic: (t) => t * t * t,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

// Which captions are visible at time t, with their opacity and entrance progress.
function activeCaptions(captions, t) {
  const out = [];
  for (const cap of captions) {
    if (t < cap.start || t > cap.end) continue;
    const inDur = cap.inDur == null ? 0.35 : cap.inDur;
    const outDur = cap.outDur == null ? 0.35 : cap.outDur;
    const fadeIn = clamp01((t - cap.start) / (inDur || 1e-6));
    const fadeOut = clamp01((cap.end - t) / (outDur || 1e-6));
    const opacity = Math.min(fadeIn, fadeOut);
    if (opacity <= 0) continue;
    out.push({ cap, opacity, enter: fadeIn, exit: 1 - fadeOut });
  }
  return out;
}

// Map a time onto the montage of moves. The piece GLIDES over the first
// `glide` fraction of its slot, then HOLDS for the rest — a deliberate
// "move… beat… move" rhythm instead of a fast blur. When the storyboard
// provides a weighted `flurrySchedule` (important moves hold longer), slots
// come from it; otherwise every move gets an equal slot.
// `slotFrac` is the raw 0..1 position within the slot (for camera pulses).
function plyAt(cfg, t) {
  const glide = cfg.montageGlide != null ? cfg.montageGlide : 0.58;
  const sched = cfg.flurrySchedule;
  if (sched && sched.length) {
    let slot = sched[0];
    for (const s of sched) { if (t >= s.start) slot = s; else break; }
    const slotFrac = clamp01((t - slot.start) / (slot.end - slot.start || 1e-6));
    return { ply: slot.ply, progress: clamp01(slotFrac / glide), slotFrac };
  }
  const n = cfg.flurryToPly - cfg.flurryFromPly + 1;
  const frac = clamp01((t - cfg.flurryStart) / (cfg.flurryEnd - cfg.flurryStart));
  const pos = frac * n;
  let idx = Math.floor(pos);
  if (idx >= n) idx = n - 1;
  const ply = cfg.flurryFromPly + idx;
  const slotFrac = clamp01(pos - idx);
  const progress = clamp01(slotFrac / glide);
  return { ply, progress, slotFrac };
}

const API = { ease, clamp01, lerp, activeCaptions, plyAt };

if (typeof module !== 'undefined' && module.exports) module.exports = API;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { engine: API }); }
