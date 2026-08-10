'use strict';
/* Fool's Mate — the fastest possible checkmate: 1.f3 e5 2.g4 Qh4#. */
const GAME = {
  title: "FOOL'S MATE", subtitle: 'the fastest checkmate',
  san: ['f3', 'e5', 'g4', 'Qh4#'],
  finishPly: 3,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
