'use strict';
/*
 * game_immortal.js — "The Immortal Game": Adolf Anderssen vs Lionel Kieseritzky,
 * London 1851. A casual game played alongside the first international tournament.
 * King's Gambit (Bishop's Gambit, ECO C33). Anderssen (White) sacrifices a
 * bishop (move 11), both rooks (moves 18-19) and his queen (move 22), then
 * forces mate: 23.Be7# — with only a bishop and two knights left.
 *
 * Move list verified against Wikipedia, chess.com and ChessBase. Registers as
 * CEF.game. (Historical note: Kieseritzky likely resigned into the forced mate;
 * the final position is a genuine forced checkmate.)
 */
const GAME = {
  title: 'THE IMMORTAL GAME',
  subtitle: 'Anderssen – Kieseritzky, 1851',
  eco: "King's Gambit (C33)",
  result: '1-0',
  san: [
    'e4', 'e5', 'f4', 'exf4', 'Bc4', 'Qh4+', 'Kf1', 'b5', 'Bxb5', 'Nf6',
    'Nf3', 'Qh6', 'd3', 'Nh5', 'Nh4', 'Qg5', 'Nf5', 'c6', 'g4', 'Nf6',
    'Rg1', 'cxb5', 'h4', 'Qg6', 'h5', 'Qg5', 'Qf3', 'Ng8', 'Bxf4', 'Qf6',
    'Nc3', 'Bc5', 'Nd5', 'Qxb2', 'Bd6', 'Bxg1', 'e5', 'Qxa1+', 'Ke2', 'Na6',
    'Nxg7+', 'Kd8', 'Qf6+', 'Nxf6', 'Be7#',
  ],
  finishPly: 44, // 23.Be7#
};

if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
