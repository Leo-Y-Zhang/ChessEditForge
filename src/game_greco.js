'use strict';
/* NN vs Greco, c.1620 — one of the oldest recorded brilliancies. Greco (Black)
 * finishes with a queen sacrifice into a smothered mate: …Qg1+ Nxg1 Nf2#. */
const GAME = {
  title: 'GRECO · 1620', subtitle: 'NN – Greco, c.1620',
  san: ['e4','e5','Nf3','Nc6','Bc4','Bc5','O-O','Nf6','Re1','O-O','c3','Qe7','d4','exd4','e5','Ng4','cxd4','Nxd4','Nxd4','Qh4','Nf3','Qxf2+','Kh1','Qg1+','Nxg1','Nf2#'],
  finishPly: 25,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
