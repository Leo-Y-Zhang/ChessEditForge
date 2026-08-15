'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const storygen = require('../src/storygen.js');
const EDITS = require('../src/edits.js');
const theme = require('../src/theme.js');
const fonts = require('../src/fonts.js');

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

// A fit measured in a typeface that will never be rendered is not a fit. The
// themes ask for Impact, Arial Black, Bahnschrift and Segoe UI and nothing
// registers a font file, so on a machine without them canvas silently
// substitutes a fallback and every width here is meaningless -- some tests then
// fail and some pass, both for reasons that have nothing to do with the copy.
//
// src/fonts.js decides what is present, and the renderer warns from the same
// module, so the check the test skips on and the check the render warns on
// cannot drift apart.
const MISSING = fonts.missing(theme);
const FONTS_PRESENT = MISSING.length === 0;
if (!FONTS_PRESENT) {
  console.error(
    `fit.test.js: ${MISSING.map((f) => `'${f}'`).join(', ')} ` +
    `${MISSING.length === 1 ? 'does' : 'do'} not resolve here, so caption widths ` +
    'cannot be measured in the typefaces that will actually be rendered. The fit ' +
    'checks are skipped rather than guessed — install them to run these.'
  );
}

for (const id of Object.keys(EDITS)) {
  test(`${id}: every caption fits the frame with only a subtle shrink`, { skip: !FONTS_PRESENT }, () => {
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
