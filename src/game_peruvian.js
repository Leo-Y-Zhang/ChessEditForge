'use strict';
/* The Peruvian Immortal — Canal vs NN, simul 1934. Both rooks + queen
 * sacrificed, finishing with Boden's mate 14.Ba6#. Verified. */
const GAME = {
  title: 'THE PERUVIAN IMMORTAL', subtitle: 'Canal vs NN, 1934',
  san: ['e4','d5','exd5','Qxd5','Nc3','Qa5','d4','c6','Nf3','Bg4','Bf4','e6','h3','Bxf3','Qxf3','Bb4','Be2','Nd7','a3','O-O-O','axb4','Qxa1+','Kd2','Qxh1','Qxc6+','bxc6','Ba6#'],
  finishPly: 26,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
