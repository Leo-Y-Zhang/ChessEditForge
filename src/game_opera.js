'use strict';
/*
 * game_opera.js — "The Opera Game": Paul Morphy vs. Duke Karl of Brunswick &
 * Count Isouard (consulting together as Black), Paris, 1858 — played in a
 * private box at a Paris opera house during a performance. Philidor Defence
 * (ECO C41). Morphy wins in 17 moves with a queen sacrifice and a rook-and-
 * bishop ("Opera") mate: 16.Qb8+ Nxb8 17.Rd8#.
 *
 * Move list triple-verified (Wikipedia, chessgames, chess.com). Registers as
 * CEF.game. (Note: 11...Nbd7 needs the file disambiguation; 12.O-O-O castles.)
 */
const GAME = {
  title: 'THE OPERA GAME',
  subtitle: 'Morphy vs Brunswick & Isouard, 1858',
  eco: 'Philidor Defence (C41)',
  result: '1-0',
  san: [
    'e4', 'e5', 'Nf3', 'd6', 'd4', 'Bg4', 'dxe5', 'Bxf3', 'Qxf3', 'dxe5',
    'Bc4', 'Nf6', 'Qb3', 'Qe7', 'Nc3', 'c6', 'Bg5', 'b5', 'Nxb5', 'cxb5',
    'Bxb5+', 'Nbd7', 'O-O-O', 'Rd8', 'Rxd7', 'Rxd7', 'Rd1', 'Qe6', 'Bxd7+',
    'Nxd7', 'Qb8+', 'Nxb8', 'Rd8#',
  ],
  finishPly: 32, // 17.Rd8#
};

if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
