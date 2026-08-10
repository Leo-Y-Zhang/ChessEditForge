# Design Spec — Magnus Carlsen cinematic chess edit (ChessEditForge)

Date: 2026-07-19
Status: Approved (design approved by user; local-only build, no repo push, no uploads)

## 1. Goal

Produce a **vertical (1080×1920) cinematic "character edit" of Magnus Carlsen**, in the style of
a Better Call Saul TikTok character edit (dramatic captions + build + beat-drop), that the user can
**export to a real video file and post to TikTok** with zero installs and zero copyright risk.

The reference (a BCS edit by @blanco_editor) could not be viewed directly. We rebuild the *format and
feeling* — not any specific footage/music — for chess, with fully original, clearable assets.

Non-goals (v1): audio bundling, multiple templates, a full chess engine, uploading/publishing.

## 2. Hard constraints

- **No copyrighted assets.** No real Magnus photos/clips, no copyrighted music, no copyrighted quotes.
  Chess moves are facts (not copyrightable). All caption copy is **original**.
- **Truthful captions.** Any stat shown must be verified (see research task). Verify-then-claim.
- **Runs on a locked-down Windows PC.** Deliverable must open in an existing browser (no installs,
  no admin). Final artifact is a single self-contained HTML file the user double-clicks.
- **Faceless-channel launch gate respected.** Build/prep only. No account creation, no upload.

## 3. Concept (locked)

Cinematic Magnus Carlsen character edit — **the chessboard is the hero** (no face). Huge kinetic
typography, a dramatic original monologue revealed as captions, and his iconic queen-sacrifice mate
(**Carlsen–Karjakin, 2016 WC rapid tie-break, the Qh6+ finish**) plays out on the board with a
beat-drop on the winning move. Exact PGN verified before shipping.

## 4. Storyboard (~20 s, 30 fps, drop at ~13 s)

| t (s) | Beat | On-screen |
|------|------|-----------|
| 0.0–2.0 | Cold open | Black; one glowing white king; tiny line: *"they call him"* |
| 2.0–4.0 | Name slam | Camera pulls back to a live board; kinetic type: **MAGNUS** → **CARLSEN** |
| 4.0–7.0 | Credentials | Moves glide; captions: *"World #1 for over a decade."* → *"125 games unbeaten."* (both verified) |
| 7.0–11.0 | Tension | Slow zoom in, vignette tightens, grain rises: *"He doesn't beat you."* → *"He suffocates you."* |
| 11.0–13.0 | Silence | Board freezes one move from the end: *"One move."* |
| 13.0 | **DROP** | Screen shake + flash; queen-sac move slides in; **CHECKMATE** slams; king topples; board glows |
| 13.0–17.0 | Lockup | **MAGNUS CARLSEN** + original tagline: *"the machine with a pulse."* |
| 17.0–20.0 | Outro | Subtle *"♟ follow for more"*; fade to black; beat-drop marker at 13 s for audio sync |

All copy above is original and non-infringing. Exact stats swapped for verified figures from research.

## 5. Architecture (browser, single-canvas)

Everything visible is drawn to **one `<canvas>` (1080×1920)** so it can be captured by `captureStream()`.
Plain classic scripts (work from `file://`), each attaching to a global namespace and also exporting via
CommonJS tail for Node unit tests. A tiny dependency-free `build.js` inlines everything into
`dist/chess-edit.html` — the single file the user keeps.

Modules (each one purpose, testable in isolation):

- `src/engine.js` — canvas setup, rAF timeline clock, scene scheduler (given t → active scenes), easing.
- `src/board.js` — draw board + pieces from a position array; animate a piece square→square; capture
  fade; square glow/highlight; board camera (zoom/pan) transform.
- `src/chess.js` — **pure**: minimal move-applier. Given a position (8×8 array) + a move (from,to,flags:
  capture/castle/enpassant/promotion), return the new position. Plus a SAN→move resolver limited to the
  featured game (or a pre-resolved from/to move list). No full legality engine needed.
- `src/game.js` — data: featured game's verified move list (from/to/flags) + start position + scene cue
  timings (when each caption fires, when the drop lands). Swapping games = editing this file.
- `src/captions.js` — kinetic typography drawn on canvas: fade/slide/scale/letter reveals; big name
  lockup; quote lines; the CHECKMATE hit.
- `src/fx.js` — post effects on canvas: vignette, film grain, bloom/glow, letterbox bars, screen shake.
- `src/export.js` — `MediaRecorder` over `canvas.captureStream(30)`; pick best mime
  (`video/mp4;codecs=avc1` if supported, else `video/webm`); assemble Blob; trigger download.
- `src/theme.js` — palette, fonts, sizing constants (single source of truth for the look).
- `src/ui.js` + `index.html` — Preview / Replay / **Record & Export** buttons; progress; format readout.

## 6. Data flow

`game.js` (moves + cues) → `engine` clock drives `board` (piece animation) and `captions`/`fx` (overlays)
each frame → composited on one canvas → `export` records the canvas stream → `.mp4` (or `.webm`) download.

## 7. Rendering choices

- Pieces: Unicode chess glyphs (♔♕♖♗♘♙ / ♚♛♜♝♞♟) via `fillText`, with glow/shadow, on a styled board.
- Board palette + type: cinematic dark theme (deep contrast, warm accent on the drop). Defined in `theme.js`.
- Easing: cubic/expo eases for slams and slow zooms; shared easing lib in `engine.js`.

## 8. Audio

Exported **silent by design.** A beat-drop marker is shown at t=13 s. Guidance (README): add a trending
sound inside the TikTok app (licensed + algorithm boost) and align the drop to 13 s. No bundled track.

## 9. Export format

- Target: 1080×1920, 30 fps, ~20 s, `.mp4` (H.264) via MediaRecorder where supported; `.webm` fallback.
- One-click "Record & Export" plays the animation start→finish and downloads the file.
- Optional later "pro path": Node + headless render + ffmpeg for deterministic frames (only if the
  device permits installs). Structured so it can be added without touching the browser code.

## 10. Testing & verification

- **Unit tests (Node `--test`)** for pure logic: `chess.js` move-applier (positions after each move of the
  featured game match expected), `engine.js` scheduler (correct active scenes at sample times), caption
  timing math, easing bounds. Deterministic — always runnable.
- **Visual verification:** attempt `node-canvas` to render keyframe PNGs at 0/3/8/13/16 s and inspect
  layout/typography/pieces/board; fall back to a self-contained contact-sheet HTML if native canvas
  won't install. Confirm the Qh6+ move lands correctly and CHECKMATE hits on the drop.
- **Export path:** verified by code review + mime-support probing; final one-click export confirmed by
  the user (records in their real browser). Defensive mime fallbacks so it never silently fails.

## 11. Deliverables

- `dist/chess-edit.html` — the single self-contained file to open and export from.
- `index.html` + `src/*` — dev sources.
- `README.md` — how to open, how to export, how to add a TikTok sound, how to swap the game/player.
- Local git history (no remote push).

## 12. Reuse note

Because player/game/copy live in data (`game.js`, `captions.js` config, `theme.js`), producing a second
edit (different player, different game, different palette) is a data change, not a rewrite — directly
useful for the faceless-channel plan.
