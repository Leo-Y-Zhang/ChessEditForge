'use strict';
/* The Evergreen Game — Anderssen vs Dufresne, Berlin 1852 (Evans Gambit).
 * Queen sac 21.Qxd7+!! then a double-bishop mate 24.Bxe7#. Verified. */
const GAME = {
  title: 'THE EVERGREEN GAME', subtitle: 'Anderssen – Dufresne, 1852',
  san: ['e4','e5','Nf3','Nc6','Bc4','Bc5','b4','Bxb4','c3','Ba5','d4','exd4','O-O','d3','Qb3','Qf6','e5','Qg6','Re1','Nge7','Ba3','b5','Qxb5','Rb8','Qa4','Bb6','Nbd2','Bb7','Ne4','Qf5','Bxd3','Qh5','Nf6+','gxf6','exf6','Rg8','Rad1','Qxf3','Rxe7+','Nxe7','Qxd7+','Kxd7','Bf5+','Ke8','Bd7+','Kf8','Bxe7#'],
  finishPly: 46,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
