# ChessEditForge — chess edit factory

A generator that pumps out cinematic, vertical (9:16) **chess edits for TikTok**,
rendered to real `.mp4` files entirely on your machine (one `npm install`, no
system tools, no uploads, no copyrighted assets). One consistent premium style (brand set in `src/brand.js`),
one command to render the whole catalogue into your iCloud folder.

## Make all the edits → iCloud

```bash
npm install                 # once: headless canvas + wasm H.264 encoder
node batch.js               # render every edit -> "~/iCloudDrive/Chess Edits/"
node batch.js opera reti    # render just some
```

### One dependency that is not in `package.json`

The themes ask for **Impact, Arial Black, Bahnschrift and Segoe UI**, and nothing
here registers a font file — so the typography comes from whatever the machine
already has. On Windows those are all present, which is where this catalogue was
rendered. Elsewhere canvas substitutes a fallback: the video still renders and is
perfectly watchable, but the typography is not the typography that was tuned, and
neither are the caption widths that `test/fit.test.js` exists to protect.

That is now said out loud rather than left to be discovered. `src/fonts.js` checks
the three families a theme needs; a render prints a warning naming any that are
missing, and the caption-fit tests skip themselves rather than measure in a
typeface that will never be used.

The fonts are deliberately not bundled: Impact is not redistributable, and
swapping the display face for one that is free is a design decision rather than a
technical one.

`batch.js` writes one self-contained folder per post — the `.mp4`, a
ready-to-paste `caption.txt`, and a `sound.txt` — plus a master `INDEX.md`.
`sound.txt` is specific, never generic: the **vibe**, the **exact sound**, the
**exact search string** to type into TikTok's sound search, a **backup**, and
a **sync** note saying which on-screen move the drop should land on.

**Posting:** upload the `.mp4` to TikTok → search the sound.txt string → add
the Sound → line its drop up per the sync note. Silent by design (ride
trending audio; better for reach).

## The catalogue (30 edits — Days 01–30, a full month)

Magnus Carlsen · The Immortal Game · The Opera Game · The Evergreen Game · The
Peruvian Immortal · Réti's Mate · The King Hunt (Lasker–Thomas) · Scholar's Mate ·
Legall's Mate · Game of the Century (Byrne–Fischer) · Fool's Mate · Smothered Mate ·
The Gold Coins Game (Levitsky–Marshall) · Rubinstein's Immortal · Tal the Magician ·
The Battle of Hastings (Steinitz–von Bardeleben) · Fischer 1963 (R. Byrne–Fischer) ·
Morphy vs Bird · Greco c.1620 · Anand's Immortal · Kasparov's Immortal (vs Topalov) ·
Wei Yi's Immortal · The Double Bishop Sac (Lasker–Bauer) · The Shilling Trap ·
Nezhmetdinov's Immortal · Deep Blue 1997 (the machine beats Kasparov) · The King
Walk (Short–Timman) · The Immortal Zugzwang (Sämisch–Nimzowitsch) · Shirov's Bh3
(vs Topalov) · Gukesh, WCC 2024 (the youngest world champion). Each is one entry
in `src/edits.js`.

## Every edit has

- a **setup intro card** (WHITE vs BLACK, or a concept card) so any viewer gets it;
- an **escalating montage** with **chess.com-style move badges** (Brilliant `!!`,
  Blunder `??`, mate `#`);
- **impact effects** — screen-shake, flashes, landing shockwaves on the big moves;
- a **sacrifice → finish drop** — a toppled king on checkmate, a soft topple
  and spotlight on a resignation — and a legend outro;
- the **channel watermark** and a distinct colour theme.

## Add a new edit

1. `src/game_<id>.js` — the game as a verified SAN move list (the engine replays it;
   `npm test` asserts it reaches the real mate).
2. one entry in `src/edits.js` — theme + game + a compact `def` (intro, montage/drop
   ply windows, badges, copy) + `audio` + `caption`.
3. `node render.js --edit=<id> --keyframes` to preview, then `node batch.js`.

Themes live in `src/theme_*.js`; rebrand everything in `src/brand.js`.

## How it works

Pure Canvas-2D shared by the Node renderer and an in-browser player, so preview ==
export. `chess.js` (SAN engine) · `engine.js` (timeline) · `pieces.js`/`board.js`
(vectors, camera, badges, shockwaves) · `captions.js`/`fx.js` (type + film fx) ·
`storygen.js` (def → storyboard) · `scene.js` (per-frame director) ·
`renderer.js`/`render.js`/`batch.js` (H.264 mp4 out) · `build.js` (self-contained HTML).

## Honesty

All copy original; games are the real, verified moves (facts, not copyrightable);
no photos/clips/music of anyone; nothing is uploaded — it only makes the files.
Where a historical game was resigned into a forced mate (e.g. Réti's), it's framed
as a forced mate.
