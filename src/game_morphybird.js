'use strict';
/* Bird vs Morphy, London 1858. Morphy (Black) plays 17…Rxf2!! (rook sac) and
 * a cascade of queen checks; Bird resigns after …Qb1+. Verified. */
const GAME = {
  title: 'MORPHY vs BIRD', subtitle: 'Bird – Morphy, 1858',
  san: ['e4','e5','Nf3','d6','d4','f5','Nc3','fxe4','Nxe4','d5','Ng3','e4','Ne5','Nf6','Bg5','Bd6','Nh5','O-O','Qd2','Qe8','g4','Nxg4','Nxg4','Qxh5','Ne5','Nc6','Be2','Qh3','Nxc6','bxc6','Be3','Rb8','O-O-O','Rxf2','Bxf2','Qa3','c3','Qxa2','b4','Qa1+','Kc2','Qa4+','Kb2','Bxb4','cxb4','Rxb4+','Qxb4','Qxb4+','Kc2','e3','Bxe3','Bf5+','Rd3','Qc4+','Kd2','Qa2+','Kd1','Qb1+'],
  finishPly: 57,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
