'use strict';
/* theme_immortal.js — "The Immortal Game" look: romantic-era oxblood + gold,
 * warm wooden board, aged-ivory vs walnut pieces. Registers as CEF.theme. */
const THEME = {
  W: 1080,
  H: 1920,
  fps: 60,
  duration: 18, // seconds — tighter cut for reach

  bg: { top: '#1c0e0c', mid: '#2a1210', bottom: '#080403', glow: 'rgba(150,72,30,0.30)' },

  board: {
    light: '#c7b493',       // aged ivory
    dark: '#5c3b2c',        // warm walnut
    frame: '#d8b447',       // rich gold
    frameDark: '#7f5c17',
    coord: 'rgba(20,10,6,0.4)',
    lastFrom: 'rgba(216,180,71,0.30)',
    lastTo: 'rgba(216,180,71,0.60)',
  },

  piece: {
    white: '#f5ead0',       // aged ivory
    whiteRim: '#3a2416',
    whiteDetail: 'rgba(120,80,30,0.55)',
    black: '#231410',       // dark walnut
    blackRim: '#d59a53',    // warm amber rim so it reads on wood
    blackDetail: 'rgba(226,180,120,0.55)',
    shadow: 'rgba(0,0,0,0.5)',
  },

  accent: '#e6b03e',        // gold
  danger: '#c0392b',        // crimson checkmate

  text: {
    primary: '#f7ecd6',
    dim: 'rgba(247,236,214,0.72)',
    accent: '#e6b03e',
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
