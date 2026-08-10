'use strict';
/* Deep Blue vs Garry Kasparov — Rematch Game 6, New York, 11 May 1997.
 * Caro-Kann; the book sacrifice 8.Nxe6; Kasparov resigned after 19.c4 and
 * Deep Blue won the match 3.5-2.5 — the first computer to beat a reigning
 * world champion in a match at standard time controls.
 * Verified vs Wikipedia (Game 6 article) + chessprogramming.org. */
const GAME = {
  title: 'DEEP BLUE', subtitle: 'the machine beats the champion',
  san: [
    'e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Nd7', 'Ng5', 'Ngf6',
    'Bd3', 'e6', 'N1f3', 'h6', 'Nxe6', 'Qe7', 'O-O', 'fxe6', 'Bg6+', 'Kd8',
    'Bf4', 'b5', 'a4', 'Bb7', 'Re1', 'Nd5', 'Bg3', 'Kc8', 'axb5', 'cxb5',
    'Qd3', 'Bc6', 'Bf5', 'exf5', 'Rxe7', 'Bxe7', 'c4',
  ],
  finishPly: 36,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game_deepblue: GAME }); }
