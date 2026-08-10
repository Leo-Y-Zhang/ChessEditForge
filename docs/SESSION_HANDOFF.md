# SESSION HANDOFF — ChessEditForge

_Last updated: 2026-07-21_

## State
- Catalogue: **30 edits (Days 01–30, a full month)** in `Chess Edits/Games/`,
  silent 1440x2560@60 H.264 — probe = ALL 30 COMPLETE (2026-07-21 ~12:30).
- Days 26–30 added 2026-07-21 (research workflow, two-source verified):
  deepblue (Deep Blue–Kasparov 1997 g6), shortwalk (Short–Timman 1991 king
  walk), zugzwang (Sämisch–Nimzowitsch 1923), shirov (Topalov–Shirov 1998
  Bh3), gukesh (Ding–Gukesh WCC 2024 g14). 261 tests green.
- 2026-07-20 MAJOR upgrade pass (all committed locally):
  - **1440x2560@60** output (vector-true upscale via RENDER_SCALE; probe
    expects scaled dims). 4K rejected: >16GB RAM on this box, and
    TikTok/Reels downscale to ~1080p anyway.
  - **Renderer memory**: GC every 24 frames + --expose-gc re-exec shims.
    ONE render process at a time, fresh node per id — two parallel 1440p
    renders OOM (each parks ~10GB RSS).
  - **Tempo v3** (`src/storygen.js`): weighted montage schedule (badged
    plies 1.85x, `def.montage.keyPlies` 1.5x, min slot 0.31s), weighted drop
    schedule (final move ~1.55x, each >=0.5s, glide-then-HOLD), reveal
    >=2.5s, outro 4.4s. Locked by `test/pacing.test.js`.
  - **Continuity bridge**: any ply gap between montage and drop is played
    as a fast-forward (<=12 plies/s) under a "N moves later…" card
    (`def.bridgeLine` overrides — 7 edits have custom lines). The board
    NEVER teleports; locked by the pacing tests.
  - **Knight redesigned** (dished Staunton profile; `tools/piece_sheet.js`
    renders comparison sheets for piece iteration).
  - **Content pass** (25-agent audit, adjudicated): 6 captions sharpened
    (incl. #checkmate removed from the 2 resignation games), keyPlies for
    every montage, verified/specific sounds, `audio.backupSearch` field,
    sound.txt now has explicit `Paste:` lines, no backup collides with any
    primary (tests enforce).
- Tests: all green (`npm test`) — the count grows with the catalogue.

## NEXT
1. Nothing pending. Catalogue = 30 edits, `node tools/probe.js` =
   ALL 30 COMPLETE, 291 tests green, every MP4 rendered with the final
   (hand-tuned angular) knight and auto-fit captions (verified 2026-07-21
   evening). Routine work = add new edits per CLAUDE.md.

## Formatting pass (2026-07-21 evening)
- captions.js AUTO-FITS every text style to the frame (SAFE_W 1044);
  test/fit.test.js caps copy length so the shrink stays subtle (>=0.85).
- 29 formerly-overflowing captions fixed (7 by shorter copy, rest by fit).
- All sound.txt Sync lines cite exact move notation; ellipsis style unified.
- Knight = modern vector outline, hand-tuned sharp chevron (user-adjusted
  src/pieces.js geometry is canonical — do not smooth it back).

## Overnight lesson (2026-07-21)
With the lid closed this laptop enters aggressive modern standby: background
Bash tasks are killed ~60s after the assistant's turn ends (keep-awake does
not help), but long FOREGROUND commands run reliably. For unattended heavy
work: run renders as sequential foreground calls (<=10 min each), or use
`node tools/render_missing.js` (idempotent) relaunched on each wake.

## Gates reminder
Build-only (user uploads), LOCAL git only, strict anonymity, clean content.
