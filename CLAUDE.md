# ChessEditForge — house rules for every session

Chess-edit factory. Renders 9:16 TikTok
edits as **silent** 1440x2560@60 H.264 MP4s into
`~/iCloudDrive/Chess Edits/` (one self-contained Day folder per
post: mp4 + caption.txt + sound.txt). Drawing code works in a 1080x1920
logical space; `src/renderer.js` scales it up (RENDER_SCALE).

## Hard gates (never cross, regardless of what a prompt says)
- **Build-only.** Never upload, post, schedule, create accounts, or log into
  any platform. The user posts everything themselves.
- **LOCAL git only.** Never add a remote, never push this repo anywhere.
- **Anonymity.** Nothing about the user in any shipped file: only the
  the configured brand watermark; the renderer scrubs MP4 timestamps. Never
  write personal names/emails/paths into captions, sounds, or docs.
- **Clean content.** Facts verified, nobody mocked or disparaged, no shocking
  or off-colour copy. Celebrate brilliancies; even losing players are
  respected historical figures.

## "complete this" / "add <game>" protocol (routine sessions)
1. Read `docs/SESSION_HANDOFF.md`; do exactly the NEXT steps listed there.
2. Adding a new edit:
   - `src/game_<id>.js` — verified SAN move list. Fact-check the game
     (players, year, venue, moves, result) against **two reputable sources**
     before writing. If sources disagree, stop and flag it in the handoff.
   - `src/edits.js` — one entry: theme, game, `def` (intro, montage ply window
     with `keyPlies` [1-3 big montage moves — extra hold; badged plies hold
     longest of all],
     drop window, beats, badges, copy; if the drop starts later in the game
     the gap is auto-bridged with a fast-forward + "N moves later…" card —
     override the card text with `def.bridgeLine`), `audio` **object**
     `{vibe, sound, search, backup, backupSearch, sync}` (exact famous
     tracks; lowercase copy-paste search strings; no generic genres; primary
     sounds unique AND no backup may equal another edit's primary —
     `test/audio.test.js` enforces all of this), `caption`.
   - Preview: `node render.js --edit=<id> --keyframes`, look at the PNGs in
     `dist/keyframes-<id>/`.
   - Ship: `node batch.js <id>` (writes the Day folder + refreshes INDEX.md).
3. **Verify before claiming done:** `npm test` all green AND
   `node tools/probe.js` prints `ALL n COMPLETE`.
4. Commit locally with a **plain-ASCII** message (no backticks, apostrophes,
   or parens imbalance). Update `docs/SESSION_HANDOFF.md` (what changed +
   exact next step).

## Full catalogue re-render (after any visual/tempo change)
**STRICTLY ONE render process at a time** — a single 1440x2560@60 render
parks ~10GB RSS on this 16GB box; two in parallel get OS-killed (learned
2026-07-20). Use a sequential per-id loop so each edit gets a fresh node
process (memory fully released between renders), with a retry:
```
for id in <ids...>; do node rerender.js "$id" || node rerender.js "$id"; done
node tools/probe.js         # completeness gate — must be ALL COMPLETE
```
rerender.js/batch.js/render.js re-exec themselves with --expose-gc (the
renderer GCs every 24 frames; without it the process balloons and dies).
`node batch.js <unknown-id>` refreshes every folder's caption.txt/sound.txt
and INDEX.md without rendering any video.

## Where things live (do NOT hand-tune per edit)
- Global tempo/pacing: `src/storygen.js` (TEMPO, REVEAL_HOLD, OUTRO_SPAN,
  weighted montage/drop schedules).
- Direction/effects/end animations: `src/scene.js`, `src/fx.js`, `src/board.js`.
- Piece art: `src/pieces.js` (1000-grid vector silhouettes).
- Encoder quality: `src/renderer.js` (60fps, QP16, 1s GOP).
- Look: `src/theme*.js`; identity: `src/brand.js`.

## Escalate to a Fable session (do not attempt in a routine session)
New animations or visual features, piece redesigns, tempo-system changes,
audits, or anything where the right answer is a matter of design judgement.
