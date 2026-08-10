'use strict';
/* theme.js — single source of truth for the look (colors, fonts, sizing). */
const THEME = {
  W: 1080,
  H: 1920,
  fps: 60,
  duration: 20, // seconds

  bg: { top: '#0b0f15', mid: '#0a1520', bottom: '#04060a', glow: 'rgba(40,90,130,0.30)' },

  board: {
    light: '#6a7583',
    dark: '#2c333d',
    frame: '#c8a24a',   // gold frame
    frameDark: '#8a6c26',
    coord: 'rgba(255,255,255,0.28)',
    lastFrom: 'rgba(232,182,74,0.28)',
    lastTo: 'rgba(232,182,74,0.55)',
  },

  piece: {
    white: '#f4efe4',
    whiteRim: '#20242b',
    whiteDetail: 'rgba(90,70,30,0.55)',
    black: '#141a21',
    blackRim: '#8fb6cf',   // cool rim so black pieces read on dark squares
    blackDetail: 'rgba(180,210,230,0.5)',
    shadow: 'rgba(0,0,0,0.55)',
  },

  accent: '#e8b64a',   // gold
  danger: '#ff4d3d',   // checkmate red

  text: {
    primary: '#ffffff',
    dim: 'rgba(255,255,255,0.72)',
    accent: '#e8b64a',
  },

  fonts: {
    display: 'Impact, "Arial Black", sans-serif',       // name + CHECKMATE
    head: 'Bahnschrift, "Segoe UI Semibold", sans-serif', // stat cards
    body: '"Segoe UI", Bahnschrift, sans-serif',          // quiet lines
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = THEME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { theme: THEME }); }
