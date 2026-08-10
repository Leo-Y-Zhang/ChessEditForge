'use strict';
/* Robert Byrne vs Bobby Fischer, US Championship 1963. Fischer (Black) plays
 * two knight sacs (…Nxf2, …Nxg2) and the quiet 21…Qd7!; Byrne resigned in a
 * position onlookers thought was winning for White. Verified. */
const GAME = {
  title: 'FISCHER · 1963', subtitle: 'R. Byrne – Fischer, 1963',
  san: ['d4','Nf6','c4','g6','g3','c6','Bg2','d5','cxd5','cxd5','Nc3','Bg7','e3','O-O','Nge2','Nc6','O-O','b6','b3','Ba6','Ba3','Re8','Qd2','e5','dxe5','Nxe5','Rfd1','Nd3','Qc2','Nxf2','Kxf2','Ng4+','Kg1','Nxe3','Qd2','Nxg2','Kxg2','d4','Nxd4','Bb7+','Kf1','Qd7'],
  finishPly: 41,
};
if (typeof module !== 'undefined' && module.exports) module.exports = GAME;
else { (typeof window !== 'undefined' ? window : globalThis).CEF = Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { game: GAME }); }
