# Mutation-guided tests

New `node:test` files (`chess-validation`, `mp4-scrub`, `scene-boundaries`,
`timeline-boundaries`, plus `test/helpers/load-private.js`), new pytest cases
in `finish/test_music.py` and `finish/test_finish.py`, and a manual mutation
runner, `test/mutation/run.js`, with its results in `before.json` and
`after.json`. Production code and CI are unchanged: CI already runs `npm test`
and the two `finish/` pytest files.

`load-private.js` evaluates a source file in a sandbox to reach pure helpers
that are not exported, so the production export surface stays as it is.

## Measurement

`node test/mutation/run.js RESULTS.json` applies each mutant to the source
file, runs the matching gate (`node --test` for `src/`, the `finish/` pytest
files for Python), and restores the bytes afterwards even if the gate fails.
A syntax or import failure aborts the run instead of counting as a kill.
"Before" is the same run with the new test files set aside and the two
`finish/` test files at their `main` versions.

| Module | Mutants tried | Killed before | Killed after |
| --- | ---: | ---: | ---: |
| `src/chess.js` | 26 | 17 | 26 |
| `src/engine.js` | 7 | 3 | 6 |
| `src/storygen.js` | 6 | 3 | 6 |
| `src/script.js` | 4 | 2 | 4 |
| `src/scene.js` | 7 | 0 | 7 |
| `src/renderer.js` | 6 | 0 | 5 |
| `finish/music.py` | 12 | 3 | 12 |
| `finish/finish.py` | 6 | 0 | 6 |
| `finish/gather_cues.py` | 2 | 1 | 2 |
| **Total** | **76** | **29** | **74** |

The two survivors are equivalent mutants:

- `engine.js:29` `caption-or-to-and`: a time outside a caption's interval
  already gets opacity 0 and is skipped by the next check.
- `renderer.js:26` `scrub-skip-eight-byte-box`: the only difference is an
  empty 8-byte box ending exactly at the end of the file, which holds no
  timestamps to scrub either way.

## Examples of what the new tests kill

| Test | Mutant killed (line) |
| --- | --- |
| castling validates home pieces, rights, every empty square and every king-path square | `chess.js:211` home-square check weakened; `:217` start square not checked for attack |
| en passant needs the correct rank, enemy pawn and immediate history | `chess.js:177` rank ignored |
| SAN requires exactly one candidate | `chess.js:273` ambiguous SAN accepted |
| MP4 scrub zeros both timestamp widths while preserving flags and other fields | `renderer.js:25` scrub skipped; `:38` wrong version branch |
| MP4 scrub preserves video payload even when it contains timestamp tag bytes | `renderer.js:36` scrub runs past the `moov` box into the video |
| bridge shows each intervening ply and settles at its exact end | `scene.js:66-67` bridge boundaries |
| a bridge that starts at time zero still gets its BRIDGE cut | `script.js:130` `bridgeStart` tested for truthiness |
| `test_wav_clips_overload_instead_of_wrapping_signed_pcm` | `music.py:369` clipping skipped (loud audio would wrap around) |
| `test_timeline_rejects_one_corrupted_event` | `music.py:40` unknown or negative cues accepted |
| `test_command_runner_accepts_success_and_stops_on_nonzero_status` | `finish.py:115` failed commands ignored |
| `test_gather_ignores_truncated_cut_rows...` | `gather_cues.py:10` truncated `cuts.txt` rows accepted |

## Results

Measured locally with Node 25 and Python 3.13 (numpy 2.1.3, pytest 8.4.2):
`npm test` 414 passed; `finish/` pytest 146 passed; mutants 29/76 before,
74/76 after (the 2 survivors are equivalent).
