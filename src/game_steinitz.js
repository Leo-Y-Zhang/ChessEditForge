'use strict';
/* The Battle of Hastings — Steinitz vs von Bardeleben, Hastings 1895. The
 * "untouchable rook" (22.Rxe7+ ...) — Bardeleben walked out; Steinitz
 * demonstrated the forced mate 35.Qd6#. Verified canonical score. */
const GAME = {
  title: 'THE BATTLE OF HASTINGS', subtitle: 'Steinitz – von Bardeleben, 1895',
  san: ['e4','e5','Nf3','Nc6','Bc4','Bc5','c3','Nf6','d4','exd4','cxd4','Bb4+','Nc3','d5','exd5','Nxd5','O-O','Be6','Bg5','Be7','Bxd5','Bxd5','Ncxd5','Qxd5','Bxe7','Nxe7','Re1','f6','Qe2','Qd7','Rac1','c6','d5','cxd5','Nd4','Kf7','Ne6','Rhc8','Qg4','g6','Ng5+','Ke8','Rxe7+','Kf8','Rf7+','Kg8','Rg7+','Kh8','Rxh7+','Kg8','Rg7+','Kh8','Qh4+','Kxg7','Qh7+','Kf8','Qh8+','Ke7','Qg7+','Ke8','Qg8+','Ke7','Qf7+','Kd8','Qf8+','Qe8','Nf7+','Kd7','Qd6#'],
  finishPly: 68,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
