'use strict';
/* Reti's Mate — Reti vs Tartakower, Vienna 1910. Queen sac 9.Qd8+!! then
 * a double-check bishop mate (11.Bd8#). Verified (finish is a forced mate). */
const GAME = {
  title: "RÉTI'S MATE", subtitle: 'Réti – Tartakower, 1910',
  san: ['e4','c6','d4','d5','Nc3','dxe4','Nxe4','Nf6','Qd3','e5','dxe5','Qa5+','Bd2','Qxe5','O-O-O','Nxe4','Qd8+','Kxd8','Bg5+','Kc7','Bd8#'],
  finishPly: 20,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
