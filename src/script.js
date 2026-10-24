'use strict';
/*
 * script.js — the words and the timings that go next to each video, generated from the
 * same storyboard the renderer uses, so they can never drift from the picture:
 *   narration(edit) -> lines for TikTok's built-in text-to-speech, each with its start time
 *   cuts(edit)      -> the beat-cut moments (hook, reveal, beats, badges, drop, finish)
 * narrationText / cutsText format them as narration.txt and cuts.txt for the Day folder.
 */
const storygen = require('./storygen.js');

// planning estimate of the voice's pace (about 156 words a minute); a line that would run
// into the next one is shortened, or left to the on-screen text
const WORDS_PER_SEC = 2.6;
const PIECES = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight' };
const SMALL = new Set(['a', 'an', 'and', 'of', 'the', 'de', 'von', 'v', 'vs']);

const r2 = (x) => Math.round(x * 100) / 100;

// "24.Rxd4" -> "rook takes d4", "Bxh7+" -> "bishop takes h7, check", "3…Nd4?!" -> "knight d4"
function sayMove(tok) {
  const m = /^(?:\d+\s*(?:\.{1,3}|…)\s*)?(O-O-O|O-O|([KQRBN])?([a-h]?[1-8]?)(x)?([a-h][1-8])(=[QRBN])?)([+#]?)[!?]*$/.exec(tok);
  if (!m) return null;
  let s;
  if (m[1] === 'O-O-O') s = 'castles long';
  else if (m[1] === 'O-O') s = 'castles';
  else {
    s = (m[2] ? PIECES[m[2]] + ' ' : '') + (m[4] ? (m[2] ? 'takes ' : m[3] + ' takes ') : '') + m[5];
    if (m[6]) s += ' promotes to ' + PIECES[m[6][1]];
  }
  if (m[7] === '+') s += ', check';
  if (m[7] === '#') s += ', checkmate';
  return s;
}

// on-screen copy -> something a voice reads naturally
function speakable(text) {
  let s = String(text)
    .replace(/&/g, ' and ').replace(/\s\+\s/g, ' and ')
    .replace(/No\.\s*(\d)/g, 'number $1')
    .replace(/[·—–]/g, ',').replace(/…/g, '...')
    .replace(/[“”"]/g, '');
  s = s.split(/\s+/).filter(Boolean).map((w) => {
    const lead = /^[(,]*/.exec(w)[0], trail = /[.,;:)]*$/.exec(w.slice(lead.length))[0];
    const core = w.slice(lead.length, w.length - trail.length);
    const mv = sayMove(core);
    return lead + (mv != null ? mv : core) + trail;
  }).join(' ');
  s = s.replace(/[!?]{2,}/g, '!').replace(/\s+,/g, ',').replace(/,\s*,/g, ',').replace(/^,\s*/, '').trim();
  // shouted words (QUEEN, RAN) are emphasis on screen; the voice reads them plainly
  s = s.replace(/\b[A-Z]{2,}\b/g, (w) => w.toLowerCase());
  s = s.charAt(0).toUpperCase() + s.slice(1).replace(/([.!?] )([a-z])/g, (m, p, c) => p + c.toUpperCase());
  return /[.!?…]$/.test(s) ? s : s + '.';
}

function titleCase(text) {
  return String(text).toLowerCase().split(/(\s+|-)/).map((w, i) =>
    (i > 0 && SMALL.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

// "Then rook takes d4, a rook sacrifice." -> "A rook sacrifice." (the screen still shows the move)
function shorten(line) {
  const m = /^(?:then |and )?(?:(?:king|queen|rook|bishop|knight) )?(?:takes )?[a-h][1-8](?:, check(?:mate)?)?, (.+)$/i.exec(line);
  return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : line;
}

function speechSecs(line) {
  return line.split(/\s+/).filter(Boolean).length / WORDS_PER_SEC;
}

function narration(edit) {
  const sb = storygen.makeStoryboard(edit.def);
  const { cfg, captions, def } = sb;
  const I = def.intro || {};
  const lines = [];
  const add = (at, text, what) => lines.push({ at: r2(at), text, what });

  const name = captions.find((c) => c.style === 'name');
  if (I.mode === 'concept') add(name.start, speakable(titleCase([I.line1, I.line2].filter(Boolean).join(' '))), 'intro');
  else add(name.start, speakable(titleCase(I.white || def.outro.title) + ' versus ' + titleCase(I.black || '')), 'intro');

  const beatSet = new Set(def.beats || []);
  for (const c of captions) {
    if (c.style !== 'line') continue;
    const what = beatSet.has(c.text) ? 'beat' : c.text === def.tension ? 'tension' : 'drop';
    add(c.start, speakable(c.text), what);
  }
  const end = captions.find((c) => c.style === 'checkmate');
  // a resignation names who resigned when the finish kicker says so ("...  —  White resigns")
  const who = /—\s*(.+)$/.exec(def.finishKicker || '');
  // otherwise the side that did not make the last move resigned (ply 0 is White's first move)
  const loser = def.drop.toPly % 2 === 0 ? 'Black' : 'White';
  const endLine = !cfg.resign ? speakable(titleCase(end.text))
    : who && /resign/i.test(who[1]) ? speakable(who[1]) : loser + ' resigns.';
  const bare = (s) => s.toLowerCase().replace(/[^a-z ]/g, '').trim();
  const last = lines[lines.length - 1];
  if (!bare(endLine).includes(bare(last.text))) add(end.start, endLine, 'finish');
  else last.text = endLine;   // the drop line already says it ("resigns."): say who

  const O = def.outro || {};
  add(cfg.outroStart + 0.15, [speakable(titleCase(O.title || '')), O.tag ? speakable(O.tag) : '', 'Follow for more.']
    .filter(Boolean).join(' '), 'outro');

  lines.sort((a, b) => a.at - b.at);
  // fit: walk backwards, so a line dropped late in the edit gives its time to the one before
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    const until = i + 1 < lines.length ? lines[i + 1].at : cfg.duration;
    const fits = () => speechSecs(l.text) <= until - l.at;
    if (!fits() && l.what === 'outro') l.text = l.text.replace(/ Follow for more\.$/, '');
    if (!fits() && (l.what === 'beat' || l.what === 'tension')) l.text = shorten(l.text);
    if (!fits() && (l.what === 'beat' || l.what === 'tension')) { lines.splice(i, 1); continue; }
    l.until = until;
  }
  return lines;
}

function cuts(edit) {
  const { cfg, captions, def } = storygen.makeStoryboard(edit.def);
  const out = [];
  const add = (at, kind, note) => out.push({ at: r2(at), kind, note });
  const names = captions.filter((c) => c.style === 'name' && c.start < cfg.boardFadeStart);
  names.forEach((c) => add(c.start, 'HOOK', `"${c.text}" slams in`));
  add(cfg.boardFadeStart, 'REVEAL', 'the board appears');
  for (const c of captions) {
    if (c.style !== 'line') continue;
    if ((def.beats || []).includes(c.text)) add(c.start, 'BEAT', `"${c.text}"`);
    else if (c.text === def.tension) add(c.start, 'TENSION', `"${c.text}"`);
  }
  for (const b of cfg.badges) add(b.at, 'BADGE', `${b.type} on ${b.sq}`);
  if (cfg.bridgeStart != null) add(cfg.bridgeStart, 'BRIDGE', 'fast-forward');
  add(cfg.dropAt, 'DROP', "the sound's drop goes here");
  const last = cfg.dropSchedule[cfg.dropSchedule.length - 1];
  add(last.start + 0.55 * (last.end - last.start), 'FINAL', 'the last move lands');
  const end = captions.find((c) => c.style === 'checkmate');
  add(end.start, 'FINISH', end.text);
  add(cfg.outroStart, 'OUTRO', 'title card');
  add(cfg.duration, 'END', 'video ends');
  return out.sort((a, b) => a.at - b.at);
}

function stamp(t) {
  const m = Math.floor(t / 60), s = t - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, '0')}`;
}

function narrationText(edit) {
  return [
    "Narration for TikTok's text-to-speech",
    'In the editor tap Text, type a line, tap it and choose Text-to-speech.',
    'Start each line at the time shown so the voice lands with the words on screen.',
    '',
    ...narration(edit).map((l) => `${stamp(l.at)}  ${l.text}`),
  ].join('\n') + '\n';
}

function cutsText(edit) {
  return [
    'Beat cuts: line the sound up so its hits land on these moments',
    `Sync: ${edit.audio.sync}`,
    '',
    ...cuts(edit).map((c) => `${stamp(c.at)}  ${c.kind.padEnd(7)}  ${c.note}`),
  ].join('\n') + '\n';
}

module.exports = { narration, cuts, narrationText, cutsText, speakable, sayMove, speechSecs, stamp };
