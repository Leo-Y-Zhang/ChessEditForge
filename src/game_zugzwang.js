'use strict';
/* Friedrich Saemisch vs Aron Nimzowitsch — Copenhagen, March 1923.
 * The "Immortal Zugzwang Game": Black sacrificed a knight to paralyse the
 * whole White army; after the quiet 25...h6 (no check, no capture) White
 * resigned — every move loses material. Verified vs Wikipedia + lichess. */
const GAME = {
  title: 'THE IMMORTAL ZUGZWANG', subtitle: 'a quiet pawn move wins',
  san: [
    'd4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6', 'g3', 'Bb7', 'Bg2', 'Be7',
    'Nc3', 'O-O', 'O-O', 'd5', 'Ne5', 'c6', 'cxd5', 'cxd5', 'Bf4', 'a6',
    'Rc1', 'b5', 'Qb3', 'Nc6', 'Nxc6', 'Bxc6', 'h3', 'Qd7', 'Kh2', 'Nh5',
    'Bd2', 'f5', 'Qd1', 'b4', 'Nb1', 'Bb5', 'Rg1', 'Bd6', 'e4', 'fxe4',
    'Qxh5', 'Rxf2', 'Qg5', 'Raf8', 'Kh1', 'R8f5', 'Qe3', 'Bd3', 'Rce1', 'h6',
  ],
  finishPly: 49,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game_zugzwang: GAME }); }
