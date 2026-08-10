'use strict';
/* theme_ice.js — cold steel-blue + white. Registers as CEF.theme. */
const THEME = {
  W: 1080, H: 1920, fps: 60, duration: 18,
  bg: { top: '#0a121c', mid: '#0d1b2a', bottom: '#03060a', glow: 'rgba(70,130,180,0.28)' },
  board: {
    light: '#c4cdd6', dark: '#33465c', frame: '#9fb4c8', frameDark: '#4a5c70',
    coord: 'rgba(10,18,28,0.4)', lastFrom: 'rgba(120,180,220,0.30)', lastTo: 'rgba(120,180,220,0.62)',
  },
  piece: {
    white: '#f2f6fb', whiteRim: '#1c2836', whiteDetail: 'rgba(70,90,120,0.5)',
    black: '#131c28', blackRim: '#7fb8e0', blackDetail: 'rgba(150,200,235,0.5)', shadow: 'rgba(0,0,0,0.5)',
  },
  accent: '#6cc3e8', danger: '#ff5b5b',
  text: { primary: '#f2f6fb', dim: 'rgba(242,246,251,0.72)', accent: '#7fd0f0' },
  fonts: { display: 'Impact, "Arial Black", sans-serif', head: 'Bahnschrift, "Segoe UI Semibold", sans-serif', body: '"Segoe UI", Bahnschrift, sans-serif' },
};
if (typeof module !== 'undefined' && module.exports) module.exports = THEME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { theme: THEME }); }
