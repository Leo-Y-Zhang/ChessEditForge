'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const EDITS = require('../src/edits.js');

const ids = Object.keys(EDITS);

// Every edit ships a specific, focused sound suggestion: the vibe, the exact
// sound, a copy-paste search string, a backup with its OWN copy-paste search,
// and where to line the drop up.
for (const id of ids) {
  const a = EDITS[id].audio;
  test(`${id}: audio is a complete structured suggestion`, () => {
    assert.equal(typeof a, 'object', 'audio is structured');
    for (const k of ['vibe', 'sound', 'search', 'backup', 'backupSearch', 'sync']) {
      assert.ok(typeof a[k] === 'string' && a[k].trim().length > 0, `audio.${k} present`);
    }
    assert.ok(a.sound.includes('—'), 'sound names track AND artist');
    assert.ok(a.backup.includes('—'), 'backup names track AND artist');
    assert.ok(!/\(search:/i.test(a.backup), 'backup search lives in backupSearch, not inline');
  });

  test(`${id}: search strings are specific, copy-paste ready`, () => {
    for (const s of [a.search, a.backupSearch]) {
      assert.equal(s, s.toLowerCase(), `"${s}" is lowercase (typed as-is)`);
      assert.ok(!/search tiktok/i.test(s), 'no meta "Search TikTok" phrasing');
      assert.ok(s.trim().split(/\s+/).length >= 2, `"${s}" is not a one-word genre`);
      assert.ok(!/["“”()—]/.test(s), `"${s}" has nothing to strip before typing`);
    }
    assert.ok(!/search tiktok/i.test(a.vibe + a.backup + a.sync), 'no generic phrasing anywhere');
  });
}

test('primary sounds are unique across the whole catalogue', () => {
  const sounds = ids.map((id) => EDITS[id].audio.sound);
  assert.equal(new Set(sounds).size, sounds.length);
});

test('no backup sound collides with any primary sound', () => {
  // if a backup were another day's primary, posting the fallback would reuse
  // a sound already tied to a different edit
  const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const primaries = new Set(ids.map((id) => norm(EDITS[id].audio.sound)));
  for (const id of ids) {
    const b = norm(EDITS[id].audio.backup);
    assert.ok(!primaries.has(b), `${id} backup "${EDITS[id].audio.backup}" is another edit's primary`);
  }
});
