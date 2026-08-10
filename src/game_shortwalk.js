'use strict';
/* Nigel Short vs Jan Timman — Tilburg (Interpolis) 1991, round 4.
 * Alekhine's Defence; with queens and rooks on, Short walked his king
 * Kh2-Kg3-Kf4-Kg5 to support Qg7#; Timman resigned after 34.Kg5.
 * Verified vs lichess study PGN + Wikipedia "King walk" + hotoffthechess. */
const GAME = {
  title: 'THE KING WALK', subtitle: 'the king delivers the mate himself',
  san: [
    'e4', 'Nf6', 'e5', 'Nd5', 'd4', 'd6', 'Nf3', 'g6', 'Bc4', 'Nb6',
    'Bb3', 'Bg7', 'Qe2', 'Nc6', 'O-O', 'O-O', 'h3', 'a5', 'a4', 'dxe5',
    'dxe5', 'Nd4', 'Nxd4', 'Qxd4', 'Re1', 'e6', 'Nd2', 'Nd5', 'Nf3', 'Qc5',
    'Qe4', 'Qb4', 'Bc4', 'Nb6', 'b3', 'Nxc4', 'bxc4', 'Re8', 'Rd1', 'Qc5',
    'Qh4', 'b6', 'Be3', 'Qc6', 'Bh6', 'Bh8', 'Rd8', 'Bb7', 'Rad1', 'Bg7',
    'R8d7', 'Rf8', 'Bxg7', 'Kxg7', 'R1d4', 'Rae8', 'Qf6+', 'Kg8', 'h4', 'h5',
    'Kh2', 'Rc8', 'Kg3', 'Rce8', 'Kf4', 'Bc8', 'Kg5',
  ],
  finishPly: 66,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game_shortwalk: GAME }); }
