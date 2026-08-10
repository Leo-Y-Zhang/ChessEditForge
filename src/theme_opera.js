'use strict';
/* theme_opera.js — "The Opera Game" look: royal purple velvet + gilt gold,
 * cream & aubergine board, ivory vs obsidian pieces. Registers as CEF.theme. */
const THEME = {
  W: 1080,
  H: 1920,
  fps: 60,
  duration: 17, // seconds — punchy

  bg: { top: '#180d28', mid: '#211135', bottom: '#080410', glow: 'rgba(150,86,196,0.28)' },

  board: {
    light: '#d8cfbd',       // warm cream
    dark: '#3c2f55',        // aubergine / violet-slate
    frame: '#d6b13f',       // gilt gold
    frameDark: '#7e5f18',
    coord: 'rgba(20,10,30,0.4)',
    lastFrom: 'rgba(224,181,63,0.30)',
    lastTo: 'rgba(224,181,63,0.62)',
  },

  piece: {
    white: '#f5efdf',       // ivory
    whiteRim: '#241a30',
    whiteDetail: 'rgba(120,90,40,0.55)',
    black: '#191026',       // obsidian violet
    blackRim: '#d3ac53',    // gold rim (regal, reads on the aubergine squares)
    blackDetail: 'rgba(226,196,130,0.55)',
    shadow: 'rgba(0,0,0,0.5)',
  },

  accent: '#e2b843',        // gold
  danger: '#d1354b',        // crimson

  text: {
    primary: '#f6f0e2',
    dim: 'rgba(246,240,226,0.72)',
    accent: '#e2b843',
  },

  fonts: {
    display: 'Impact, "Arial Black", sans-serif',
    head: 'Bahnschrift, "Segoe UI Semibold", sans-serif',
    body: '"Segoe UI", Bahnschrift, sans-serif',
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = THEME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { theme: THEME }); }
