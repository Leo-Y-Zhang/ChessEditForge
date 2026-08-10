'use strict';
/* theme_gold.js — black + gold "hall of fame". Registers as CEF.theme. */
const THEME = {
  W: 1080, H: 1920, fps: 60, duration: 18,
  bg: { top: '#141210', mid: '#1d1812', bottom: '#050403', glow: 'rgba(206,164,66,0.24)' },
  board: {
    light: '#cabf9f', dark: '#2c2620', frame: '#d9b64a', frameDark: '#7d5e1a',
    coord: 'rgba(20,16,10,0.42)', lastFrom: 'rgba(217,182,74,0.30)', lastTo: 'rgba(217,182,74,0.62)',
  },
  piece: {
    white: '#f4ecd6', whiteRim: '#241d12', whiteDetail: 'rgba(120,95,40,0.5)',
    black: '#171310', blackRim: '#d8b968', blackDetail: 'rgba(226,200,140,0.5)', shadow: 'rgba(0,0,0,0.5)',
  },
  accent: '#e8c24a', danger: '#d1354b',
  text: { primary: '#f6efdc', dim: 'rgba(246,239,220,0.72)', accent: '#e8c24a' },
  fonts: { display: 'Impact, "Arial Black", sans-serif', head: 'Bahnschrift, "Segoe UI Semibold", sans-serif', body: '"Segoe UI", Bahnschrift, sans-serif' },
};
if (typeof module !== 'undefined' && module.exports) module.exports = THEME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { theme: THEME }); }
