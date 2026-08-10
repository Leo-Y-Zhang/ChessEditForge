'use strict';
/* theme_crimson.js — blood red + black. Registers as CEF.theme. */
const THEME = {
  W: 1080, H: 1920, fps: 60, duration: 18,
  bg: { top: '#1c0a0a', mid: '#260c0e', bottom: '#080303', glow: 'rgba(190,44,44,0.26)' },
  board: {
    light: '#c8bda8', dark: '#3e2626', frame: '#cf9d3a', frameDark: '#7a5416',
    coord: 'rgba(28,10,10,0.4)', lastFrom: 'rgba(207,157,58,0.30)', lastTo: 'rgba(207,157,58,0.60)',
  },
  piece: {
    white: '#f4ecdd', whiteRim: '#2a1616', whiteDetail: 'rgba(120,70,50,0.5)',
    black: '#1a0f0f', blackRim: '#d76a5c', blackDetail: 'rgba(230,150,130,0.5)', shadow: 'rgba(0,0,0,0.5)',
  },
  accent: '#e2a63a', danger: '#e23b2f',
  text: { primary: '#f7ede0', dim: 'rgba(247,237,224,0.72)', accent: '#e6b84a' },
  fonts: { display: 'Impact, "Arial Black", sans-serif', head: 'Bahnschrift, "Segoe UI Semibold", sans-serif', body: '"Segoe UI", Bahnschrift, sans-serif' },
};
if (typeof module !== 'undefined' && module.exports) module.exports = THEME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { theme: THEME }); }
