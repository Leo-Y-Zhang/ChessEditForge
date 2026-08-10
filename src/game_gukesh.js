'use strict';
/* Ding Liren vs Gukesh Dommaraju — World Championship 2024, Game 14,
 * Singapore, 12 December 2024. In a drawn rook endgame Ding blundered
 * 55.Rf2??; after the forced trades Ding resigned on move 58 and Gukesh,
 * 18, became the youngest undisputed world champion in history.
 * Verified vs Wikipedia (WCC 2024) + lichess broadcast + chess.com. */
const GAME = {
  title: 'GUKESH', subtitle: 'the youngest world champion',
  san: [
    'Nf3', 'd5', 'g3', 'c5', 'Bg2', 'Nc6', 'd4', 'e6', 'O-O', 'cxd4',
    'Nxd4', 'Nge7', 'c4', 'Nxd4', 'Qxd4', 'Nc6', 'Qd1', 'd4', 'e3', 'Bc5',
    'exd4', 'Bxd4', 'Nc3', 'O-O', 'Nb5', 'Bb6', 'b3', 'a6', 'Nc3', 'Bd4',
    'Bb2', 'e5', 'Qd2', 'Be6', 'Nd5', 'b5', 'cxb5', 'axb5', 'Nf4', 'exf4',
    'Bxc6', 'Bxb2', 'Qxb2', 'Rb8', 'Rfd1', 'Qb6', 'Bf3', 'fxg3', 'hxg3', 'b4',
    'a4', 'bxa3', 'Rxa3', 'g6', 'Qd4', 'Qb5', 'b4', 'Qxb4', 'Qxb4', 'Rxb4',
    'Ra8', 'Rxa8', 'Bxa8', 'g5', 'Bd5', 'Bf5', 'Rc1', 'Kg7', 'Rc7', 'Bg6',
    'Rc4', 'Rb1+', 'Kg2', 'Re1', 'Rb4', 'h5', 'Ra4', 'Re5', 'Bf3', 'Kh6',
    'Kg1', 'Re6', 'Rc4', 'g4', 'Bd5', 'Rd6', 'Bb7', 'Kg5', 'f3', 'f5',
    'fxg4', 'hxg4', 'Rb4', 'Bf7', 'Kf2', 'Rd2+', 'Kg1', 'Kf6', 'Rb6+', 'Kg5',
    'Rb4', 'Be6', 'Ra4', 'Rb2', 'Ba8', 'Kf6', 'Rf4', 'Ke5', 'Rf2', 'Rxf2',
    'Kxf2', 'Bd5', 'Bxd5', 'Kxd5', 'Ke3', 'Ke5',
  ],
  finishPly: 115,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game_gukesh: GAME }); }
