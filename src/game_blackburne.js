'use strict';
/* The Blackburne Shilling Gambit — a famous opening trap (Italian Game, C50),
 * not a single historical game. If White greedily grabs material after 3...Nd4,
 * Black mates: 7...Nf3#, the white king smothered by its own pieces. Black wins. */
const GAME = {
  title: 'THE SHILLING TRAP', subtitle: 'Blackburne Shilling Gambit',
  san: ['e4','e5','Nf3','Nc6','Bc4','Nd4','Nxe5','Qg5','Nxf7','Qxg2','Rf1','Qxe4+','Be2','Nf3#'],
  finishPly: 13,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
