'use strict';
/* Wei Yi's Immortal — Wei Yi vs Lazaro Bruzon, Danzhou 2015. 22.Rxf7!! opens
 * the king, which is hunted from f7 to h3; the quiet 36.Be1 seals it and Bruzon
 * resigned. White (Wei Yi, then 16) wins. */
const GAME = {
  title: "WEI YI'S IMMORTAL", subtitle: 'Wei Yi – Bruzon, 2015',
  san: ['e4','c5','Nf3','e6','Nc3','a6','Be2','Nc6','d4','cxd4','Nxd4','Qc7','O-O','Nf6','Be3','Be7','f4','d6','Kh1','O-O','Qe1','Nxd4','Bxd4','b5','Qg3','Bb7','a3','Rad8','Rae1','Rd7','Bd3','Qd8','Qh3','g6','f5','e5','Be3','Re8','fxg6','hxg6','Nd5','Nxd5','Rxf7','Kxf7','Qh7+','Ke6','exd5+','Kxd5','Be4+','Kxe4','Qf7','Bf6','Bd2+','Kd4','Be3+','Ke4','Qb3','Kf5','Rf1+','Kg4','Qd3','Bxg2+','Kxg2','Qa8+','Kg1','Bg5','Qe2+','Kh4','Bf2+','Kh3','Be1'],
  finishPly: 70,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
