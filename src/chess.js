'use strict';
/*
 * chess.js — minimal, pure chess move logic for replaying a known game.
 *
 * Board: length-64 array. index = row*8 + file, where row 0 = rank 8 (top of
 * screen) and file 0 = a-file (left). So 'a8' = 0, 'h8' = 7, 'a1' = 56, 'h1' = 63.
 * Pieces: 'P N B R Q K' = white, lowercase = black, null = empty.
 *
 * It resolves standard-algebraic (SAN) moves against a position and refuses
 * anything that is not a legal move (castling rights and en passant included
 * when replay() supplies the game state), so a mistyped game fails loudly
 * instead of rendering an impossible move.
 */

function sq(nameStr) {
  const file = nameStr.charCodeAt(0) - 97; // 'a' -> 0
  const rank = Number(nameStr[1]);         // 1..8
  const row = 8 - rank;                    // rank 8 -> row 0
  return row * 8 + file;
}

function name(idx) {
  const row = Math.floor(idx / 8);
  const file = idx % 8;
  const rank = 8 - row;
  return String.fromCharCode(97 + file) + rank;
}

function emptyBoard() {
  return new Array(64).fill(null);
}

function startPosition() {
  const b = emptyBoard();
  const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let f = 0; f < 8; f++) {
    b[sq('a8') + f] = back[f];          // black back rank (row 0)
    b[sq('a7') + f] = 'p';              // black pawns (row 1)
    b[sq('a2') + f] = 'P';              // white pawns (row 6)
    b[sq('a1') + f] = back[f].toUpperCase(); // white back rank (row 7)
  }
  return b;
}

const isWhitePiece = (p) => !!p && p === p.toUpperCase();
const colorOf = (p) => (p == null ? null : (isWhitePiece(p) ? 'w' : 'b'));
const sign = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0);

function clearPath(board, from, to) {
  const fr = Math.floor(from / 8), ff = from % 8;
  const tr = Math.floor(to / 8), tf = to % 8;
  const sr = sign(tr - fr), sf = sign(tf - ff);
  let r = fr + sr, f = ff + sf;
  while (r !== tr || f !== tf) {
    if (board[r * 8 + f] != null) return false;
    r += sr; f += sf;
  }
  return true;
}

// Can a piece of `type` (uppercase letter) standing on `from` move to `to`,
// geometrically (ignoring check)? Pawns handled separately.
function canReach(board, from, to, type) {
  const fr = Math.floor(from / 8), ff = from % 8;
  const tr = Math.floor(to / 8), tf = to % 8;
  const dr = tr - fr, df = tf - ff;
  const adr = Math.abs(dr), adf = Math.abs(df);
  switch (type) {
    case 'N': return (adr === 1 && adf === 2) || (adr === 2 && adf === 1);
    case 'K': return Math.max(adr, adf) === 1;
    case 'B': return adr === adf && adr !== 0 && clearPath(board, from, to);
    case 'R': return (dr === 0 || df === 0) && (adr + adf !== 0) && clearPath(board, from, to);
    case 'Q': return ((adr === adf && adr !== 0) || (dr === 0 || df === 0)) &&
                     (adr + adf !== 0) && clearPath(board, from, to);
    default: return false;
  }
}

// Is square `idx` attacked by any piece of `byColor`?
function isAttacked(board, idx, byColor) {
  const kr = Math.floor(idx / 8), kf = idx % 8;
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p == null || colorOf(p) !== byColor) continue;
    const type = p.toUpperCase();
    if (type === 'P') {
      // pawn attacks toward the target square
      const r = Math.floor(i / 8), f = i % 8;
      const dir = isWhitePiece(p) ? -1 : 1; // white attacks up (row-1)
      if (r + dir === kr && Math.abs(f - kf) === 1) return true;
    } else if (canReach(board, i, idx, type)) {
      return true;
    }
  }
  return false;
}

// Is `color`'s king attacked in this position?
function isInCheck(board, color) {
  const king = color === 'w' ? 'K' : 'k';
  const kIdx = board.indexOf(king);
  if (kIdx < 0) return false;
  return isAttacked(board, kIdx, color === 'w' ? 'b' : 'w');
}

function applyMove(board, move) {
  const b = board.slice();
  const from = sq(move.from), to = sq(move.to);
  const piece = b[from];
  if (piece == null) throw new Error('applyMove: no piece on ' + move.from);
  const white = isWhitePiece(piece);
  const type = piece.toUpperCase();
  const fromF = from % 8, toF = to % 8;
  const fromR = Math.floor(from / 8);

  // En passant: pawn changes file onto an empty square -> capture passed pawn.
  if (type === 'P' && fromF !== toF && b[to] == null) {
    b[fromR * 8 + toF] = null;
  }

  // Castling: king moves two files -> shift the rook too.
  if (type === 'K' && Math.abs(toF - fromF) === 2) {
    const row = fromR;
    if (toF === 6) { // kingside
      b[row * 8 + 5] = b[row * 8 + 7];
      b[row * 8 + 7] = null;
    } else if (toF === 2) { // queenside
      b[row * 8 + 3] = b[row * 8 + 0];
      b[row * 8 + 0] = null;
    }
  }

  if (move.promo) {
    b[to] = white ? move.promo.toUpperCase() : move.promo.toLowerCase();
  } else {
    b[to] = piece;
  }
  b[from] = null;
  return b;
}

// Game state a bare board cannot carry. `castling` holds the rights still
// available ('KQkq' subset); `ep` is the square a pawn has just passed over
// (index) or null. replay() keeps one up to date; a caller without history
// may omit it, and then castling is judged on the board alone and an en
// passant capture is allowed wherever an enemy pawn stands beside the target.
function initialState() {
  return { castling: 'KQkq', ep: null };
}

const RESULT = /^(1-0|0-1|1\/2-1\/2|\*)$/;
const SAN_PIECE = /^([KQRBN])([a-h])?([1-8])?(x)?([a-h][1-8])$/;
const SAN_PAWN = /^([a-h])(?:x([a-h]))?([1-8])(?:=([QRBNqrbn])|([QRBNqrbn]))?$/;

function fail(sanRaw, why) {
  throw new Error(`resolveSan: ${sanRaw} -> ${why}`);
}

// Is the pawn move from -> to (both indices) possible for `side`, ignoring
// whether it leaves the king in check?
function pawnCanMove(board, from, to, side, state) {
  const white = side === 'w';
  if (board[from] !== (white ? 'P' : 'p')) return false;
  const fr = Math.floor(from / 8), ff = from % 8;
  const tr = Math.floor(to / 8), tf = to % 8;
  const dir = white ? -1 : 1;
  if (tf === ff) {
    if (board[to] != null) return false;
    if (tr === fr + dir) return true;
    const startRow = white ? 6 : 1;
    return fr === startRow && tr === fr + 2 * dir && board[(fr + dir) * 8 + ff] == null;
  }
  if (Math.abs(tf - ff) !== 1 || tr !== fr + dir) return false;
  if (board[to] != null) return colorOf(board[to]) !== side;
  // en passant: the captured pawn stands beside the mover, on the target file
  const passed = board[fr * 8 + tf];
  if (passed !== (white ? 'p' : 'P') || fr !== (white ? 3 : 4)) return false;
  return !state || state.ep === to;
}

// Can `side` legally move the piece on `from` to `to` (castling aside)?
function isLegal(board, from, to, side, state, promo) {
  const p = board[from];
  if (p == null || colorOf(p) !== side) return false;
  if (board[to] != null && colorOf(board[to]) === side) return false;
  const type = p.toUpperCase();
  if (type === 'P' ? !pawnCanMove(board, from, to, side, state)
                   : !canReach(board, from, to, type)) return false;
  return !isInCheck(applyMove(board, { from: name(from), to: name(to), promo }), side);
}

// Does `side` have any legal move at all? (Castling never escapes check, so
// it is not needed to tell mate from check.)
function hasLegalMove(board, side, state) {
  for (let from = 0; from < 64; from++) {
    if (board[from] == null || colorOf(board[from]) !== side) continue;
    for (let to = 0; to < 64; to++) {
      const promo = board[from].toUpperCase() === 'P' && (to < 8 || to > 55) ? 'Q' : null;
      if (to !== from && isLegal(board, from, to, side, state, promo)) return true;
    }
  }
  return false;
}

function resolveCastle(board, sanRaw, side, state, long) {
  const white = side === 'w';
  const row = white ? 7 : 0;
  const enemy = white ? 'b' : 'w';
  const right = long ? (white ? 'Q' : 'q') : (white ? 'K' : 'k');
  if (state && !state.castling.includes(right)) fail(sanRaw, 'castling right already lost');
  if (board[row * 8 + 4] !== (white ? 'K' : 'k') ||
      board[row * 8 + (long ? 0 : 7)] !== (white ? 'R' : 'r')) {
    fail(sanRaw, 'king or rook not on its home square');
  }
  const between = long ? [1, 2, 3] : [5, 6];
  if (between.some((f) => board[row * 8 + f] != null)) fail(sanRaw, 'pieces between king and rook');
  const kingPath = long ? [4, 3, 2] : [4, 5, 6];
  if (kingPath.some((f) => isAttacked(board, row * 8 + f, enemy))) {
    fail(sanRaw, 'king would castle out of, through or into check');
  }
  const home = white ? 'e1' : 'e8';
  return { from: home, to: (long ? 'c' : 'g') + home[1] };
}

// Resolve a SAN move for `side` on `board` to {from, to, promo}. Throws unless
// the SAN names exactly one legal move, and unless its capture sign matches
// the board. Check and mate signs are ignored here (replay checks them).
function resolveSan(board, sanRaw, side, state) {
  const white = side === 'w';
  const s = String(sanRaw).trim().replace(/[+#]?[!?]*$/, '');

  if (s === 'O-O' || s === '0-0') return resolveCastle(board, sanRaw, side, state, false);
  if (s === 'O-O-O' || s === '0-0-0') return resolveCastle(board, sanRaw, side, state, true);

  const pm = s.match(SAN_PAWN);
  if (pm) {
    const [, srcFile, capFile, rankCh, promoEq, promoBare] = pm;
    const promo = (promoEq || promoBare || '').toUpperCase() || null;
    const toName = (capFile || srcFile) + rankCh;
    const to = sq(toName);
    const toR = Math.floor(to / 8);
    const lastRow = white ? 0 : 7;
    if ((toR === lastRow) !== (promo != null)) {
      fail(sanRaw, promo ? 'promotion before the last rank' : 'a pawn on the last rank must promote');
    }
    const back = white ? 1 : -1;
    let from;
    if (capFile) {
      from = (toR + back) * 8 + (srcFile.charCodeAt(0) - 97);
    } else {
      const one = (toR + back) * 8 + (to % 8);
      from = board[one] === (white ? 'P' : 'p') ? one : (toR + 2 * back) * 8 + (to % 8);
    }
    if (from < 0 || from > 63 || board[from] !== (white ? 'P' : 'p') ||
        !isLegal(board, from, to, side, state, promo)) {
      fail(sanRaw, 'not a legal pawn move');
    }
    return { from: name(from), to: toName, promo };
  }

  const m = s.match(SAN_PIECE);
  if (!m) fail(sanRaw, 'unreadable SAN');
  const [, type, fileCh, rankCh, capture, toName] = m;
  const to = sq(toName);
  const want = white ? type : type.toLowerCase();
  const candidates = [];
  for (let i = 0; i < 64; i++) {
    if (board[i] !== want) continue;
    if (fileCh && i % 8 !== fileCh.charCodeAt(0) - 97) continue;
    if (rankCh && Math.floor(i / 8) !== 8 - Number(rankCh)) continue;
    if (isLegal(board, i, to, side, state, null)) candidates.push(i);
  }
  if (candidates.length !== 1) fail(sanRaw, `${candidates.length} candidates`);
  if (!!capture !== (board[to] != null)) {
    fail(sanRaw, capture ? 'nothing to capture there' : 'a capture written without x');
  }
  return { from: name(candidates[0]), to: toName, promo: null };
}

function applySan(board, san, side, state) {
  return applyMove(board, resolveSan(board, san, side, state));
}

// Rights and en-passant square after `mv` (already resolved) is played.
function nextState(board, mv, state) {
  let castling = state.castling;
  for (const sqName of [mv.from, mv.to]) {
    const drop = { e1: 'KQ', h1: 'K', a1: 'Q', e8: 'kq', h8: 'k', a8: 'q' }[sqName];
    if (drop) castling = castling.split('').filter((c) => !drop.includes(c)).join('');
  }
  const from = sq(mv.from), to = sq(mv.to);
  const doublePush = board[from] != null && board[from].toUpperCase() === 'P' &&
    Math.abs(Math.floor(to / 8) - Math.floor(from / 8)) === 2;
  return { castling, ep: doublePush ? (from + to) / 2 : null };
}

// Replay a SAN list from the start position. Every move must be legal, and a
// check or mate sign must match the position it produces. A result token
// ("1-0", "0-1", "1/2-1/2", "*") may close the list and is skipped.
function replay(sans) {
  let board = startPosition();
  let state = initialState();
  const positions = [];
  const moves = [];
  let side = 'w';
  sans.forEach((raw, i) => {
    if (RESULT.test(raw.trim())) {
      if (i !== sans.length - 1) throw new Error(`replay: result ${raw} before the last move`);
      return;
    }
    const mv = resolveSan(board, raw, side, state);
    const next = applyMove(board, mv);
    state = nextState(board, mv, state);
    board = next;
    const other = side === 'w' ? 'b' : 'w';
    const sign = (raw.trim().match(/([+#]?)[!?]*$/) || ['', ''])[1];
    const check = isInCheck(board, other);
    const mate = check && !hasLegalMove(board, other, state);
    const want = mate ? '#' : check ? '+' : '';
    if (sign !== want) {
      throw new Error(`resolveSan: ${raw} -> the move gives ${mate ? 'mate' : check ? 'check' : 'no check'}`);
    }
    positions.push(board);
    moves.push({ from: mv.from, to: mv.to, san: raw, side, promo: mv.promo || null });
    side = other;
  });
  return { positions, moves };
}

const API = {
  sq, name, emptyBoard, startPosition, applyMove, resolveSan, applySan, replay,
  isInCheck, isAttacked, colorOf, isWhitePiece,
};

if (typeof module !== 'undefined' && module.exports) module.exports = API;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { chess: API }); }
