'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const storygen = require('../src/storygen.js');
const EDITS = require('../src/edits.js');
const theme = require('../src/theme.js');

// Every caption must fit the frame. captions.js auto-shrinks anything wider
// than SAFE_W, so overflow is impossible — this test keeps the copy short
// enough that the shrink stays subtle (never below MIN_FIT).
const SAFE_W = 1044;
const MIN_FIT = 0.85;

const ctx = createCanvas(8, 8).getContext('2d');
const STYLE = {
  kicker: (c) => [`600 ${c.size || 34}px ${theme.fonts.head}`, c.track || 10, true],
  name: (c) => [`${c.size || 172}px ${theme.fonts.display}`, c.track || 6, true],
  line: (c) => [`${c.size || 76}px ${theme.fonts.display}`, c.track || 3, true],
  checkmate: (c) => [`${c.size || 150}px ${theme.fonts.display}`, 4, false],
  tag: (c) => [`italic ${c.size || 46}px ${theme.fonts.body}`, 0, false],
};

function width(font, text, track) {
  ctx.font = font;
  let w = -track;
  for (const ch of text) w += ctx.measureText(ch).width + track;
  return w;
}

for (const id of Object.keys(EDITS)) {
  test(`${id}: every caption fits the frame with only a subtle shrink`, () => {
    const { captions } = storygen.makeStoryboard(EDITS[id].def);
    for (const c of captions) {
      const s = STYLE[c.style];
      if (!s) continue;
      const [font, track, upper] = s(c);
      const w = width(font, upper ? c.text.toUpperCase() : c.text, track);
      const fit = w > SAFE_W ? SAFE_W / w : 1;
      assert.ok(fit >= MIN_FIT,
        `"${c.text}" (${c.style}) needs fit ${fit.toFixed(2)} — copy too long, shorten it`);
    }
  });
}
