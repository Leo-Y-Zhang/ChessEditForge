'use strict';
/* Smothered Mate — John Cochrane vs Moheschunder Bannerjee, Calcutta 1855.
 * Ends with the queen sac 20.Qg8+!! Rxg8 21.Nf7# (Philidor's smothered mate). */
const GAME = {
  title: 'SMOTHERED MATE', subtitle: 'Cochrane – Bannerjee, 1855',
  san: ['d4','Nf6','c4','g6','Nc3','d5','e3','Bg7','Nf3','O-O','cxd5','Nxd5','Be2','Nxc3','bxc3','c5','O-O','cxd4','cxd4','Nc6','Bb2','Bg4','Rc1','Rc8','Ba3','Qa5','Qb3','Rfe8','Rc5','Qb6','Rb5','Qd8','Ng5','Bxe2','Nxf7','Na5','Nh6+','Kh8','Qg8+','Rxg8','Nf7#'],
  finishPly: 40,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
