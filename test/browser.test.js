'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');
const EDITS = require('../src/edits.js');
const storygen = require('../src/storygen.js');

// src/browser.js is the player that build.js inlines into every dist/*.html.
// It is a boot-on-load IIFE, so the Node suite never touched it and nothing
// checked that the page it builds talks about the edit it is actually playing.
// This boots it against the smallest DOM it will accept and drives one export.
// node --test runs each file in its own process, so stubbing globals here is
// contained.
const ID = 'immortal';
const EDIT = EDITS[ID];
const SLUG = path.basename(EDIT.out, '.mp4');

const anchor = { href: '', download: '', click() {}, remove() {} };
const status = { textContent: '' };
const exportBtn = { disabled: false, addEventListener(evt, fn) { this.handler = fn; } };

function installDom() {
  const stage = createCanvas(8, 8);
  stage.captureStream = () => ({});
  const els = { stage, status, replay: { addEventListener() {} }, export: exportBtn };

  global.window = {
    CEF: {
      theme: require('../src/' + EDIT.theme + '.js'),
      chess: require('../src/chess.js'),
      game: require('../src/' + EDIT.game + '.js'),
      fx: require('../src/fx.js'),
      storygen,
      scene: require('../src/scene.js'),
      brand: require('../src/brand.js'),
      def: EDIT.def,
      // build.js injects this alongside CEF.def
      editSlug: SLUG,
    },
  };
  global.document = {
    readyState: 'complete',
    body: { appendChild() {} },
    addEventListener() {},
    getElementById: (id) => els[id],
    createElement: (tag) => (tag === 'a' ? anchor : createCanvas(1, 1)),
  };
  global.URL = { createObjectURL: () => 'blob:test', revokeObjectURL() {} };
  global.MediaRecorder = class {
    static isTypeSupported() { return true; }
    start() {}
    stop() { if (this.onstop) this.onstop(); }
  };
  // the player asks for one animation frame at a time; hand it a clock far
  // enough ahead that a single callback plays the whole edit
  let pending = null;
  global.requestAnimationFrame = (cb) => { pending = cb; return 1; };
  global.cancelAnimationFrame = () => { pending = null; };
  // keep the player's own timers from holding the test process open
  const realSetTimeout = global.setTimeout;
  global.setTimeout = (fn, ms) => {
    const h = realSetTimeout(fn, ms);
    if (h && typeof h.unref === 'function') h.unref();
    return h;
  };
  return () => { const cb = pending; pending = null; if (cb) cb(1e7); };
}

let exported = null;
async function runExport() {
  if (exported) return exported;
  const flushFrame = installDom();
  require('../src/browser.js'); // boots on load
  const done = exportBtn.handler();
  flushFrame();                 // lets the single recorded playthrough finish
  await done;
  exported = { download: anchor.download, status: status.textContent };
  return exported;
}

test('the browser export is named after the edit it is playing', async () => {
  const { download } = await runExport();
  assert.equal(download, SLUG + '.mp4',
    'the player exported under a different edit\'s name');
});

test('the browser player reports this edit\'s own drop time', async () => {
  const { status: msg } = await runExport();
  const dropAt = Math.round(storygen.makeStoryboard(EDIT.def).cfg.dropAt);
  assert.match(msg, new RegExp('drop hits at ' + dropAt + 's'),
    `the saved message should say ${dropAt}s, the storyboard's drop (got "${msg}")`);
});
