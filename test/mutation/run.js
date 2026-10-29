'use strict';
// Run manually, never from npm test. Each mutant gets a fresh gate process;
// source bytes are restored even if the gate fails or times out.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
process.chdir(root);
const mutants = [];
function add(module, id, from, to) { mutants.push({ module, id, from, to }); }
const chess = 'src/chess.js';
add(chess, 'path-or-to-and', 'while (r !== tr || f !== tf)', 'while (r !== tr && f !== tf)');
add(chess, 'path-ignore-blocker', 'if (board[r * 8 + f] != null) return false;', 'if (false) return false;');
add(chess, 'attack-wrong-colour', 'colorOf(p) !== byColor', 'colorOf(p) === byColor');
add(chess, 'attack-skip-last-square', 'for (let i = 0; i < 64; i++) {\n    const p', 'for (let i = 0; i < 63; i++) {\n    const p');
add(chess, 'check-return-early', 'return isAttacked(board, kIdx,', 'return false; return isAttacked(board, kIdx,');
add(chess, 'allow-friendly-capture', 'if (board[to] != null && colorOf(board[to]) === side) return false;', 'if (false) return false;');
add(chess, 'ignore-self-check', 'return !isInCheck(applyMove(board,', 'return true; return !isInCheck(applyMove(board,');
add(chess, 'double-push-ignore-middle', 'board[(fr + dir) * 8 + ff] == null', 'true');
add(chess, 'double-push-any-rank', 'fr === startRow && tr === fr + 2 * dir', 'tr === fr + 2 * dir');
add(chess, 'en-passant-ignore-rank', "passed !== (white ? 'p' : 'P') || fr !== (white ? 3 : 4)", "passed !== (white ? 'p' : 'P')");
add(chess, 'en-passant-ignore-history', 'return !state || state.ep === to;', 'return true;');
add(chess, 'castle-ignore-rights', 'state && !state.castling.includes(right)', 'false');
add(chess, 'castle-home-or-to-and', "board[row * 8 + 4] !== (white ? 'K' : 'k') ||", "board[row * 8 + 4] !== (white ? 'K' : 'k') &&");
add(chess, 'castle-ignore-occupancy', 'between.some((f) => board[row * 8 + f] != null)', 'false');
add(chess, 'castle-ignore-start-check', 'long ? [4, 3, 2] : [4, 5, 6]', 'long ? [3, 2] : [5, 6]');
add(chess, 'castle-ignore-transit-check', 'long ? [4, 3, 2] : [4, 5, 6]', 'long ? [4, 2] : [4, 6]');
add(chess, 'castle-ignore-destination-check', 'long ? [4, 3, 2] : [4, 5, 6]', 'long ? [4, 3] : [4, 5]');
add(chess, 'promotion-ignore-rank', '(toR === lastRow) !== (promo != null)', 'false');
add(chess, 'san-ignore-file', 'if (fileCh && i % 8 !== fileCh.charCodeAt(0) - 97) continue;', 'if (false) continue;');
add(chess, 'san-ignore-rank', 'if (rankCh && Math.floor(i / 8) !== 8 - Number(rankCh)) continue;', 'if (false) continue;');
add(chess, 'san-allow-ambiguous-count', 'candidates.length !== 1', 'candidates.length < 1');
add(chess, 'san-ignore-capture-sign', '!!capture !== (board[to] != null)', 'false');
add(chess, 'rights-ignore-captured-rook', '[mv.from, mv.to]', '[mv.from]');
add(chess, 'result-before-last', 'i !== sans.length - 1', 'false');
add(chess, 'replay-ignore-check-sign', 'if (sign !== want)', 'if (false)');
add(chess, 'replay-count-off-by-one', 'positions.push(board);', 'if (i > 0) positions.push(board);');

const engine = 'src/engine.js';
add(engine, 'caption-or-to-and', 't < cap.start || t > cap.end', 't < cap.start && t > cap.end');
add(engine, 'caption-include-zero-opacity', 'if (opacity <= 0)', 'if (opacity < 0)');
add(engine, 'caption-fade-max', 'Math.min(fadeIn, fadeOut)', 'Math.max(fadeIn, fadeOut)');
add(engine, 'schedule-strict-boundary', 't >= s.start', 't > s.start');
add(engine, 'schedule-progress-no-glide', 'clamp01(slotFrac / glide), slotFrac', 'clamp01(slotFrac), slotFrac');
add(engine, 'equal-slots-count-off-by-one', 'cfg.flurryToPly - cfg.flurryFromPly + 1', 'cfg.flurryToPly - cfg.flurryFromPly - 1');
add(engine, 'equal-slots-no-last-clamp', 'if (idx >= n) idx = n - 1;', 'if (idx > n) idx = n - 1;');

const story = 'src/storygen.js';
add(story, 'montage-remove-last-ply', 'p <= to; p++', 'p < to; p++');
add(story, 'bridge-include-zero-gap', 'if (gap > 0)', 'if (gap >= 0)');
add(story, 'single-drop-wrong-count', 'if (nDrop === 1)', 'if (nDrop !== 1)');
add(story, 'badge-ignore-explicit-zero', 'b.at != null ? b.at', 'b.at ? b.at');
add(story, 'badge-bridge-upper-bound', 'p <= bridge.toPly', 'p < bridge.toPly');
add(story, 'badge-bridge-lower-bound', 'p >= bridge.fromPly', 'p > bridge.fromPly');

const script = 'src/script.js';
add(script, 'say-move-castle-long-condition', "m[1] === 'O-O-O'", "m[1] !== 'O-O-O'");
add(script, 'stamp-minute-off-by-one', 'Math.floor(t / 60)', 'Math.floor(t / 60) + 1');
add(script, 'cuts-final-lands-at-start', 'last.start + 0.55 * (last.end - last.start)', 'last.start');
add(script, 'cuts-omit-bridge-at-zero', 'if (cfg.bridgeStart != null)', 'if (cfg.bridgeStart)');

const scene = 'src/scene.js';
add(scene, 'montage-start-strict-boundary', 'if (t < cfg.flurryStart)', 'if (t <= cfg.flurryStart)');
add(scene, 'montage-wrong-start-board', 'posBefore(cfg.flurryFromPly - 1)', 'posBefore(cfg.flurryFromPly + 1)');
add(scene, 'bridge-start-strict-boundary', 't >= cfg.bridgeStart', 't > cfg.bridgeStart');
add(scene, 'bridge-end-inclusive', 't < cfg.bridgeEnd', 't <= cfg.bridgeEnd');
add(scene, 'bridge-count-off-by-one', 'cfg.bridgeToPly - cfg.bridgeFromPly + 1', 'cfg.bridgeToPly - cfg.bridgeFromPly - 1');
add(scene, 'drop-slot-strict-boundary', 't >= s.start', 't > s.start');
add(scene, 'drop-end-inclusive', 't < cfg.dropAt + cfg.dropDur', 't <= cfg.dropAt + cfg.dropDur');

const renderer = 'src/renderer.js';
add(renderer, 'scrub-return-early', 'let o = 0, moovStart = -1', 'return buf; let o = 0, moovStart = -1');
add(renderer, 'scrub-skip-eight-byte-box', 'o + 8 <= buf.length', 'o + 8 < buf.length');
add(renderer, 'scrub-ignore-moov-boundary', 'i < moovEnd', 'true');
add(renderer, 'scrub-v0-wrong-version', 'if (ver === 0)', 'if (ver === 2)');
add(renderer, 'scrub-v1-wrong-version', 'else if (ver === 1)', 'else if (ver === 2)');
add(renderer, 'scrub-v1-wrong-offset', 'buf.writeUInt32BE(0, i + 20)', 'buf.writeUInt32BE(0, i + 24)');

const music = 'finish/music.py';
add(music, 'timeline-unknown-kind', 'kind not in KINDS or not math.isfinite(t)', 'False or not math.isfinite(t)');
add(music, 'timeline-allow-negative', 'or t < 0:', 'or False:');
add(music, 'timeline-allow-zero-duplicate', 'if kind in times:', 'if kind in times and times[kind]:');
add(music, 'timeline-allow-duplicates', 'if kind in times:', 'if False:');
add(music, 'timeline-allow-equal-boundaries', 'times[a] < times[b]', 'times[a] <= times[b]');
add(music, 'timeline-reject-end-event', 'float(cue["t"]) > times["END"]', 'float(cue["t"]) >= times["END"]');
add(music, 'timeline-allow-after-end', 'if any(float(cue["t"]) > times["END"] for cue in cues):', 'if False:');
add(music, 'wav-skip-shape-validation', 'audio.ndim != 2 or audio.shape[1] != 2', 'False');
add(music, 'wav-allow-nonfinite', 'or not np.isfinite(audio).all()', 'or False');
add(music, 'wav-allow-fractional-rate', 'not isinstance(sr, int) or sr <= 0', 'sr <= 0');
add(music, 'wav-wrong-channel-count', 'wav.setnchannels(2)', 'wav.setnchannels(1)');
add(music, 'wav-skip-clipping', 'np.clip(audio, -1, 1) * 32767', 'audio * 32767');

const finish = 'finish/finish.py';
add(finish, 'voice-ignore-room', 'if len(audio) / VOICE_SR > room:', 'if False:');
add(finish, 'voice-no-speed-cap', 'min(1.35, len(audio) / VOICE_SR / room * 1.02)', 'len(audio) / VOICE_SR / room * 1.02');
add(finish, 'voice-wrong-start', 'start = int(line["t"] * VOICE_SR)', 'start = int(line["t"] * VOICE_SR) + 1');
add(finish, 'voice-no-end-truncation', 'return track[: int(end * VOICE_SR)], placed', 'return track, placed');
add(finish, 'peak-use-first-measurement', 'float(lines[-1].split()[1])', 'float(lines[0].split()[1])');
add(finish, 'run-ignore-command-failure', 'if r.returncode:', 'if False:');

const gather = 'finish/gather_cues.py';
add(gather, 'seconds-subtract-fraction', 'int(m) * 60 + float(s)', 'int(m) * 60 - float(s)');
add(gather, 'cuts-accept-truncated-line', '\\s+(\\S+)\\s*(.*)$', '\\s*(\\S*)\\s*(.*)$');

const output = process.argv[2];
if (!output || !output.endsWith('.json')) throw new Error('Usage: node test/mutation/run.js RESULTS.json [module]');
const selected = mutants.filter((m) => !process.argv[3] || m.module === process.argv[3]);
if (!selected.length) throw new Error('No matching module');
const gates = {
  // The same command as `npm test`, run directly so it also works where npm is a .cmd shim.
  // TAP output, because failures are read from its "not ok" lines below.
  node: [process.execPath, ['--test', '--test-reporter=tap', 'test/**/*.test.js']],
  // Stop at the first failing assertion: a failing subset also fails the full CI gate.
  python: [process.env.PYTHON || 'python', ['-m', 'pytest', '-x', 'finish/test_music.py', 'finish/test_finish.py']],
};
function gate(kind) {
  const [command, args] = gates[kind];
  const r = spawnSync(command, args, {
    encoding: 'utf8', timeout: 60000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  });
  if (r.error || r.signal) throw new Error(`Gate did not complete: ${r.error || r.signal}`);
  return { status: r.status, output: r.stdout + r.stderr };
}
// Commands are reported by name only: the interpreter paths are machine-local.
const report = {
  gates: { node: ['node', gates.node[1]], python: ['python', gates.python[1]] },
  baseline: {}, results: [],
};
for (const kind of new Set(selected.map((m) => m.module.endsWith('.py') ? 'python' : 'node'))) {
  const r = gate(kind);
  if (r.status !== 0) throw new Error(`Unmodified ${kind} gate failed:\n${r.output}`);
  report.baseline[kind] = kind === 'node' ? r.output.slice(r.output.lastIndexOf('1..'))
    : (r.output.match(/^=+ .*passed.*=+$/gm) || []).join('\n');
}
for (const m of selected) {
  const original = fs.readFileSync(m.module);
  const source = original.toString('utf8');
  // Match either checkout newline convention without rewriting unrelated bytes.
  const from = m.from.replace(/\n/g, source.includes('\r\n') ? '\r\n' : '\n');
  if (source.split(from).length !== 2) throw new Error(`Mutation must match exactly once: ${m.id}`);
  const line = source.slice(0, source.indexOf(from)).split('\n').length;
  let r;
  try {
    fs.writeFileSync(m.module, source.replace(from, m.to));
    r = gate(m.module.endsWith('.py') ? 'python' : 'node');
  } finally {
    fs.writeFileSync(m.module, original);
  }
  const failures = m.module.endsWith('.py')
    ? (r.output.match(/^FAILED .+$/gm) || [])
    : (r.output.match(/^not ok .+$/gm) || []);
  // Syntax/import errors aren't evidence that an assertion caught a bug.
  if (r.status !== 0 && (!failures.length || /SyntaxError|ImportError|MODULE_NOT_FOUND/.test(r.output))) {
    throw new Error(`Invalid mutant or infrastructure failure: ${m.id}\n${r.output}`);
  }
  const result = { ...m, line, killed: r.status !== 0, failures };
  report.results.push(result);
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(`${m.module}:${line} ${m.id}: ${result.killed ? 'killed' : 'SURVIVED'}`);
}
