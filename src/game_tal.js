'use strict';
/* Tal vs Tringov, Amsterdam Interzonal 1964 — a 17-move miniature. Tal (White)
 * sacrifices a knight and a bishop (15.Bxf7+!) to drag the king out; Black
 * resigns after 17.Qe6+ (forced mate). "The Magician from Riga." */
const GAME = {
  title: 'TAL — THE MAGICIAN', subtitle: 'Tal – Tringov, 1964',
  san: ['e4','g6','d4','Bg7','Nc3','d6','Nf3','c6','Bg5','Qb6','Qd2','Qxb2','Rb1','Qa3','Bc4','Qa5','O-O','e6','Rfe1','a6','Bf4','e5','dxe5','dxe5','Qd6','Qxc3','Red1','Nd7','Bxf7+','Kxf7','Ng5+','Ke8','Qe6+'],
  finishPly: 32,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
