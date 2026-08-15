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

// The themes ask for Impact, Arial Black, Bahnschrift and Segoe UI, and nothing
// registers a font file — so the renderer and this test both use whatever the
// host machine happens to have. On a box without them canvas silently
// substitutes a fallback, every width comes out different, and this test passes
// or fails for reasons that have nothing to do with the copy.
//
// So measure whether the display font resolves at all, by comparing it against
// a family that certainly does not exist. Equal widths mean both fell back to
// the same default and the measurement is meaningless. Skipping and saying so
// is the only honest option: a fit measured in the wrong typeface is not a fit.
function fontResolves(family) {
  const probe = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Math.abs(
    width(`100px ${family}`, probe, 0) - width('100px "no-such-family-9d3f1a"', probe, 0)
  ) > 0.5;
}

// All three, not just the display face: the kicker uses head and the tag uses
// body, so one missing family is enough to make a caption's measured width
// wrong. Checking only the headline font would let a partial install look like
// a real run.
const NEEDED = ['display', 'head', 'body']
  .map((role) => theme.fonts[role].split(',')[0].trim());
const MISSING = NEEDED.filter((family) => !fontResolves(family));
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
