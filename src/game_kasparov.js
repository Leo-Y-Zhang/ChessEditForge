'use strict';
/* Kasparov's Immortal — Garry Kasparov vs Veselin Topalov, Wijk aan Zee 1999.
 * 24.Rxd4!! sacrifices a rook and the black king is hunted from a7 to e1;
 * Topalov resigned after 44.Qa7. White (Kasparov) wins. */
const GAME = {
  title: "KASPAROV'S IMMORTAL", subtitle: 'Kasparov – Topalov, 1999',
  san: ['e4','d6','d4','Nf6','Nc3','g6','Be3','Bg7','Qd2','c6','f3','b5','Nge2','Nbd7','Bh6','Bxh6','Qxh6','Bb7','a3','e5','O-O-O','Qe7','Kb1','a6','Nc1','O-O-O','Nb3','exd4','Rxd4','c5','Rd1','Nb6','g3','Kb8','Na5','Ba8','Bh3','d5','Qf4+','Ka7','Rhe1','d4','Nd5','Nbxd5','exd5','Qd6','Rxd4','cxd4','Re7+','Kb6','Qxd4+','Kxa5','b4+','Ka4','Qc3','Qxd5','Ra7','Bb7','Rxb7','Qc4','Qxf6','Kxa3','Qxa6+','Kxb4','c3+','Kxc3','Qa1+','Kd2','Qb2+','Kd1','Bf1','Rd2','Rd7','Rxd7','Bxc4','bxc4','Qxh8','Rd3','Qa8','c3','Qa4+','Ke1','f4','f5','Kc1','Rd2','Qa7'],
  finishPly: 86,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
