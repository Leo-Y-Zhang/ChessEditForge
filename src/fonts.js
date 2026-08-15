'use strict';
/*
 * fonts.js — which of the typefaces this project asks for the machine actually has.
 *
 * The themes name Impact, Arial Black, Bahnschrift and Segoe UI, and nothing here
 * registers a font file, so every text measurement and every rendered frame uses
 * whatever the host happens to have installed. On the box these edits are rendered
 * on, that is Windows and they are all present. Anywhere else canvas silently
 * substitutes a fallback: the video still renders, the captions still appear, and
 * the typography is simply not the typography that was designed — including the
 * caption widths that test/fit.test.js exists to protect.
 *
 * Silent is the problem. A substituted typeface looks like a rendering choice
 * rather than a missing dependency, so this says so out loud instead.
 *
 * Bundling the fonts would make it deterministic and is deliberately NOT done:
 * Impact is not redistributable, so shipping it would be a licensing problem, and
 * swapping the display face for one that is free is a design decision rather than
 * a technical one.
 */
const { createCanvas } = require('@napi-rs/canvas');

const ctx = createCanvas(8, 8).getContext('2d');
const PROBE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// A family that certainly is not installed anywhere. Anything that measures the
// same as this one did not resolve either -- both fell back to the same default.
const ABSENT = '"no-such-family-9d3f1a"';

const ROLES = ['display', 'head', 'body'];

function widthIn(family) {
  ctx.font = `100px ${family}`;
  return ctx.measureText(PROBE).width;
}

/** True if `family` resolves to a real typeface on this machine. */
function resolves(family) {
  return Math.abs(widthIn(family) - widthIn(ABSENT)) > 0.5;
}

/**
 * The families a theme asks for that this machine does not have.
 * All three roles, not just the headline one: the kicker uses `head` and the tag
 * uses `body`, so one missing family is enough to make a caption's width wrong.
 */
function missing(theme) {
  return ROLES
    .map((role) => String(theme.fonts[role]).split(',')[0].trim())
    .filter((family) => !resolves(family));
}

const warned = new Set();

/**
 * Warn once per theme, on stderr so it cannot be mistaken for render output.
 * Never throws: a substituted font produces a real, watchable video, and refusing
 * to render would be a worse trade than saying what is different about it.
 */
function warnIfMissing(theme, label) {
  const absent = missing(theme);
  if (!absent.length) return absent;
  const key = ROLES.map((r) => theme.fonts[r]).join('|');
  if (warned.has(key)) return absent;
  warned.add(key);
  console.error(
    `\n  ! ${absent.map((f) => `'${f}'`).join(', ')} ` +
    `${absent.length === 1 ? 'is' : 'are'} not installed on this machine` +
    `${label ? ` (rendering ${label})` : ''}.\n` +
    '    Canvas will substitute a fallback, so the typography and the caption\n' +
    '    widths will differ from the edits in the catalogue. The output is still\n' +
    '    a valid video; it is simply not the one this repository was tuned for.\n'
  );
  return absent;
}

module.exports = { resolves, missing, warnIfMissing, ROLES };
