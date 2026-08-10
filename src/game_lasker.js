'use strict';
/* The King Hunt — Edward Lasker vs George Thomas, London 1912. Queen sac
 * 11.Qxh7+!! marches the king from h7 to g1, mated 18.Kd2#. Verified. */
const GAME = {
  title: 'THE KING HUNT', subtitle: 'Ed. Lasker – Thomas, 1912',
  san: ['d4','e6','Nf3','f5','Nc3','Nf6','Bg5','Be7','Bxf6','Bxf6','e4','fxe4','Nxe4','b6','Ne5','O-O','Bd3','Bb7','Qh5','Qe7','Qxh7+','Kxh7','Nxf6+','Kh6','Neg4+','Kg5','h4+','Kf4','g3+','Kf3','Be2+','Kg2','Rh2+','Kg1','Kd2#'],
  finishPly: 34,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
