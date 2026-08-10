'use strict';
/* The original double bishop sacrifice — Emanuel Lasker vs Johann Bauer,
 * Amsterdam 1889. 15.Bxh7+ and 17.Bxg7 strip the king's cover; Lasker wins the
 * queen and Bauer resigned after 38.Qxd3. White (Lasker) wins. */
const GAME = {
  title: 'THE DOUBLE BISHOP SAC', subtitle: 'Lasker – Bauer, 1889',
  san: ['f4','d5','e3','Nf6','b3','e6','Bb2','Be7','Bd3','b6','Nc3','Bb7','Nf3','Nbd7','O-O','O-O','Ne2','c5','Ng3','Qc7','Ne5','Nxe5','Bxe5','Qc6','Qe2','a6','Nh5','Nxh5','Bxh7+','Kxh7','Qxh5+','Kg8','Bxg7','Kxg7','Qg4+','Kh7','Rf3','e5','Rh3+','Qh6','Rxh6+','Kxh6','Qd7','Bf6','Qxb7','Kg7','Rf1','Rab8','Qd7','Rfd8','Qg4+','Kf8','fxe5','Bg7','e6','Rb7','Qg6','f6','Rxf6+','Bxf6','Qxf6+','Ke8','Qh8+','Ke7','Qg7+','Kxe6','Qxb7','Rd6','Qxa6','d4','exd4','cxd4','h4','d3','Qxd3'],
  finishPly: 74,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
