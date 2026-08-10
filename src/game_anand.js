'use strict';
/* Anand's Immortal — Aronian vs Anand, Wijk aan Zee 2013. Anand (Black) plays
 * a dazzling attack (…Nde5!!, …Bxd4+) and Aronian resigns after …Be3. Verified. */
const GAME = {
  title: "ANAND'S IMMORTAL", subtitle: 'Aronian – Anand, 2013',
  san: ['d4','d5','c4','c6','Nf3','Nf6','Nc3','e6','e3','Nbd7','Bd3','dxc4','Bxc4','b5','Bd3','Bd6','O-O','O-O','Qc2','Bb7','a3','Rc8','Ng5','c5','Nxh7','Ng4','f4','cxd4','exd4','Bc5','Be2','Nde5','Bxg4','Bxd4+','Kh1','Nxg4','Nxf8','f5','Ng6','Qf6','h3','Qxg6','Qe2','Qh5','Qd3','Be3'],
  finishPly: 45,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
