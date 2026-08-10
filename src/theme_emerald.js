'use strict';
/* theme_emerald.js — deep club-green + gold. Registers as CEF.theme. */
const THEME = {
  W: 1080, H: 1920, fps: 60, duration: 18,
  bg: { top: '#0a1a12', mid: '#0e241a', bottom: '#040906', glow: 'rgba(46,150,96,0.26)' },
  board: {
    light: '#d6cdb4', dark: '#2f4a38', frame: '#d0ad45', frameDark: '#7a5c18',
    coord: 'rgba(10,26,18,0.4)', lastFrom: 'rgba(208,173,69,0.30)', lastTo: 'rgba(208,173,69,0.60)',
  },
  piece: {
    white: '#f4efdf', whiteRim: '#1c2a20', whiteDetail: 'rgba(90,110,70,0.5)',
    black: '#12201a', blackRim: '#dcb968', blackDetail: 'rgba(220,200,140,0.5)', shadow: 'rgba(0,0,0,0.5)',
  },
  accent: '#e0b83f', danger: '#d1354b',
  text: { primary: '#f6f1e2', dim: 'rgba(246,241,226,0.72)', accent: '#e0b83f' },
  fonts: { display: 'Impact, "Arial Black", sans-serif', head: 'Bahnschrift, "Segoe UI Semibold", sans-serif', body: '"Segoe UI", Bahnschrift, sans-serif' },
};
if (typeof module !== 'undefined' && module.exports) module.exports = THEME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { theme: THEME }); }
