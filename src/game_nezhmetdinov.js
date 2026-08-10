'use strict';
/* Nezhmetdinov's Immortal — Rashid Nezhmetdinov vs Oleg Chernikov, Rostov 1962.
 * 12.Qxf6!! sacrifices the queen for two pieces and lasting dark-square control;
 * Chernikov resigned after 33.Ke2. White (Nezhmetdinov) wins. */
const GAME = {
  title: "NEZHMETDINOV'S IMMORTAL", subtitle: 'Nezhmetdinov – Chernikov, 1962',
  san: ['e4','c5','Nf3','Nc6','d4','cxd4','Nxd4','g6','Nc3','Bg7','Be3','Nf6','Bc4','O-O','Bb3','Ng4','Qxg4','Nxd4','Qh4','Qa5','O-O','Bf6','Qxf6','Ne2+','Nxe2','exf6','Nc3','Re8','Nd5','Re6','Bd4','Kg7','Rad1','d6','Rd3','Bd7','Rf3','Bb5','Bc3','Qd8','Nxf6','Be2','Nxh7+','Kg8','Rh3','Re5','f4','Bxf1','Kxf1','Rc8','Bd4','b5','Ng5','Rc7','Bxf7+','Rxf7','Rh8+','Kxh8','Nxf7+','Kh7','Nxd8','Rxe4','Nc6','Rxf4+','Ke2'],
  finishPly: 64,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
