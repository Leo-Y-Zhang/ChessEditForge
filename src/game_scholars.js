'use strict';
/* Scholar's Mate — the classic 4-move checkmate beginners fall for.
 * 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#. */
const GAME = {
  title: "SCHOLAR'S MATE", subtitle: 'the 4-move checkmate',
  san: ['e4','e5','Bc4','Nc6','Qh5','Nf6','Qxf7#'],
  finishPly: 6,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
