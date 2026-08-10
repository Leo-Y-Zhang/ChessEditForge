'use strict';
/* The Gold Coins Game — Stepan Levitsky vs Frank Marshall, Breslau 1912.
 * Ends with the famous quiet 23...Qg3!!; White resigned (spectators are said
 * to have showered the board with gold coins). Black (Marshall) wins. */
const GAME = {
  title: 'THE GOLD COINS GAME', subtitle: 'Levitsky – Marshall, 1912',
  san: ['d4','e6','e4','d5','Nc3','c5','Nf3','Nc6','exd5','exd5','Be2','Nf6','O-O','Be7','Bg5','O-O','dxc5','Be6','Nd4','Bxc5','Nxe6','fxe6','Bg4','Qd6','Bh3','Rae8','Qd2','Bb4','Bxf6','Rxf6','Rad1','Qc5','Qe2','Bxc3','bxc3','Qxc3','Rxd5','Nd4','Qh5','Ref8','Re5','Rh6','Qg5','Rxh3','Rc5','Qg3'],
  finishPly: 45,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
