'use strict';
/* Rubinstein's Immortal — Georg Rotlewi vs Akiba Rubinstein, Lodz 1907.
 * A cascade of sacrifices (…Rxc3, …Rd2!!, …Bxe4+) ending …Rh3, White resigns
 * (mate unavoidable). Black (Rubinstein) wins. */
const GAME = {
  title: "RUBINSTEIN'S IMMORTAL", subtitle: 'Rotlewi – Rubinstein, 1907',
  san: ['d4','d5','Nf3','e6','e3','c5','c4','Nc6','Nc3','Nf6','dxc5','Bxc5','a3','a6','b4','Bd6','Bb2','O-O','Qd2','Qe7','Bd3','dxc4','Bxc4','b5','Bd3','Rd8','Qe2','Bb7','O-O','Ne5','Nxe5','Bxe5','f4','Bc7','e4','Rac8','e5','Bb6+','Kh1','Ng4','Be4','Qh4','g3','Rxc3','gxh4','Rd2','Qxd2','Bxe4+','Qg2','Rh3'],
  finishPly: 49,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
