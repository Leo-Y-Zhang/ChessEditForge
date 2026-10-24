'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const S = require('../src/script.js');
const storygen = require('../src/storygen.js');
const EDITS = require('../src/edits.js');

// narration.txt (TikTok text-to-speech lines) and cuts.txt (beat-cut moments) for every edit

test('chess moves are read out as words', () => {
  const cases = {
    'Rxd4': 'rook takes d4', '24.Rxd4': 'rook takes d4', '3…Nd4?!': 'knight d4', '3...Nd4?!': 'knight d4',
    'Bxh7+': 'bishop takes h7, check', 'Qxf7#': 'queen takes f7, checkmate', 'Be1': 'bishop e1',
    'h6': 'h6', 'exd5': 'e takes d5', 'O-O': 'castles', 'O-O-O+': 'castles long, check',
    'e8=Q+': 'e8 promotes to queen, check', 'd2!!': 'd2',
  };
  for (const [san, said] of Object.entries(cases)) assert.equal(S.sayMove(san), said, san);
  for (const word of ['the', 'No.', 'QUEEN', 'GM', '1851']) assert.equal(S.sayMove(word), null, word);
});

test('on-screen copy becomes plain sentences for the voice', () => {
  assert.equal(S.speakable('then 24.Rxd4 — a rook sacrifice.'), 'Then rook takes d4, a rook sacrifice.');
  assert.equal(S.speakable('and his QUEEN.'), 'And his queen.');
  assert.equal(S.speakable('queen + bishop eye f7.'), 'Queen and bishop eye f7.');
  assert.equal(S.speakable('down a queen, both rooks & a bishop'), 'Down a queen, both rooks and a bishop.');
  assert.equal(S.speakable('two moves. game over.'), 'Two moves. Game over.');
  assert.equal(S.speakable('world No. 1 for 15 years.'), 'World number 1 for 15 years.');
});

for (const [id, edit] of Object.entries(EDITS)) {
  test(`${id}: narration is in order, fits its slots and reads cleanly`, () => {
    const { cfg } = storygen.makeStoryboard(edit.def);
    const lines = S.narration(edit);
    assert.ok(lines.length >= 4, 'at least intro, drop, finish and outro');
    assert.equal(lines[0].what, 'intro');
    assert.equal(lines[lines.length - 1].what, 'outro');
    assert.ok(lines.some((l) => l.what === 'drop'), 'the drop is narrated');
    let prev = -1;
    for (const l of lines) {
      assert.ok(l.at > prev && l.at >= 0 && l.at < cfg.duration, `${l.at} in order and inside the video`);
      assert.ok(S.speechSecs(l.text) <= l.until - l.at,
        `"${l.text}" needs ${S.speechSecs(l.text).toFixed(2)}s, has ${(l.until - l.at).toFixed(2)}s`);
      assert.ok(!/[&#+—–·]|\b[KQRBN]x?[a-h][1-8]\b|\b[a-h]x[a-h][1-8]\b/.test(l.text), `no symbols or notation: "${l.text}"`);
      assert.match(l.text, /^[A-Z0-9].*[.!?]$/, `a sentence: "${l.text}"`);
      prev = l.at;
    }
  });

  test(`${id}: cuts mark the hook, the drop and the finish at the storyboard's times`, () => {
    const { cfg, captions } = storygen.makeStoryboard(edit.def);
    const cuts = S.cuts(edit);
    const at = (kind) => cuts.filter((c) => c.kind === kind).map((c) => c.at);
    assert.deepEqual(cuts.map((c) => c.at), cuts.map((c) => c.at).slice().sort((a, b) => a - b), 'sorted');
    assert.ok(at('HOOK').length >= 1, 'a hook');
    assert.deepEqual(at('DROP'), [cfg.dropAt]);
    assert.deepEqual(at('FINISH'), [captions.find((c) => c.style === 'checkmate').start]);
    assert.equal(at('BADGE').length, cfg.badges.length);
    assert.deepEqual(at('END'), [cfg.duration]);
    assert.ok(cuts.every((c) => c.at >= 0 && c.at <= cfg.duration));
  });
}

test('a resignation edit names the side that did not make the last move', () => {
  for (const [id, edit] of Object.entries(EDITS)) {
    if (edit.def.drop.endWord !== 'RESIGNS') continue;
    const loser = edit.def.drop.toPly % 2 === 0 ? 'Black' : 'White';
    const said = S.narration(edit).filter((l) => /resigns/.test(l.text)).map((l) => l.text);
    assert.equal(said.length, 1, `${id}: says who resigns once`);
    const colour = /\b(White|Black)\b/.exec(said[0]);
    if (colour) assert.equal(colour[1], loser, `${id}: ${said[0]}`);
  }
});

test('time stamps read m:ss.hh', () => {
  assert.equal(S.stamp(4.55), '0:04.55');
  assert.equal(S.stamp(61.2), '1:01.20');
});

test('batch writes narration.txt and cuts.txt into every Day folder, brand-free', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'cef-meta-'));
  try {
    // an unknown id refreshes every folder's text files without rendering any video
    const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'batch.js'), 'no-such-edit'],
      { env: Object.assign({}, process.env, { CHESS_EDITS_DIR: out }), encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const folders = fs.readdirSync(out, { withFileTypes: true }).filter((d) => d.isDirectory())
      .flatMap((d) => fs.readdirSync(path.join(out, d.name)).map((f) => path.join(out, d.name, f)));
    assert.equal(folders.length, Object.keys(EDITS).length);
    for (const f of folders) {
      const narration = fs.readFileSync(path.join(f, 'narration.txt'), 'utf8');
      const cuts = fs.readFileSync(path.join(f, 'cuts.txt'), 'utf8');
      assert.match(narration, /^Narration for TikTok's text-to-speech\n/);
      assert.match(narration, /\n0:00\.95 {2}\S/);
      assert.match(cuts, /\n\d:\d\d\.\d\d {2}DROP {5}/);
      assert.ok(!/example/i.test(narration + cuts), 'no brand in the scripts');
    }
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});
