'use strict';
/* Legall's Mate — Legall de Kermeur vs Saint Brie, Paris 1750. A queen
 * sacrifice trap: 5.Nxe5! Bxd1?? 6.Bxf7+ Ke7 7.Nd5#. */
const GAME = {
  title: "LEGALL'S MATE", subtitle: 'Legall – Saint Brie, 1750',
  san: ['e4','e5','Bc4','d6','Nf3','Bg4','Nc3','g6','Nxe5','Bxd1','Bxf7+','Ke7','Nd5#'],
  finishPly: 12,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
