'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const scrubMp4 = require('../test/helpers/load-private.js')('src/renderer.js', 'scrubMp4');

function box(type, payload = Buffer.alloc(0)) {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(8 + payload.length);
  header.write(type, 4, 'latin1');
  return Buffer.concat([header, payload]);
}

function clockBox(tag, version) {
  const payload = Buffer.alloc(32, 0x7b);
  payload[0] = version;
  return box(tag, payload);
}

test('MP4 scrub zeros both timestamp widths while preserving flags and other fields', () => {
  for (const tag of ['mvhd', 'tkhd', 'mdhd']) {
    for (const version of [0, 1]) {
      const clock = clockBox(tag, version);
      const expectedClock = Buffer.from(clock);
      expectedClock.fill(0, 12, version === 0 ? 20 : 28);
      const input = Buffer.concat([box('ftyp'), box('moov', box('trak', clock))]);
      const expected = Buffer.concat([box('ftyp'), box('moov', box('trak', expectedClock))]);
      assert.equal(scrubMp4(input), input, 'returns the original buffer');
      assert.deepEqual(input, expected, `${tag} version ${version}`);
    }
  }
});

test('MP4 scrub preserves video payload even when it contains timestamp tag bytes', () => {
  const media = box('mdat', Buffer.concat(['mvhd', 'tkhd', 'mdhd'].map((tag) => clockBox(tag, 0))));
  const input = Buffer.concat([media, box('moov'), media]);
  const expected = Buffer.from(input);
  assert.deepEqual(scrubMp4(input), expected);
});

test('MP4 scrub leaves absent metadata, unknown versions and partial top-level headers alone', () => {
  for (const input of [
    Buffer.alloc(0), Buffer.from([0, 0, 0, 8, 0x6d, 0x6f, 0x6f]),
    box('mdat', clockBox('mvhd', 0)), box('moov', clockBox('mvhd', 2)),
    Buffer.concat([Buffer.alloc(8), box('moov', clockBox('mvhd', 0))]),
  ]) {
    const expected = Buffer.from(input);
    assert.deepEqual(scrubMp4(input), expected);
  }
});
