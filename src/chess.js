'use strict';
/*
 * chess.js — minimal, pure chess move logic for replaying a known game.
 *
 * Board: length-64 array. index = row*8 + file, where row 0 = rank 8 (top of
 * screen) and file 0 = a-file (left). So 'a8' = 0, 'h8' = 7, 'a1' = 56, 'h1' = 63.
 * Pieces: 'P N B R Q K' = white, lowercase = black, null = empty.
 *
 * This is NOT a full legal-move engine. It resolves standard-algebraic (SAN)
 * moves against a position well enough to replay a real, already-legal game,
 * with a pin/check filter used only to break disambiguation ties.
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

// Is `color`'s king attacked in this position? Used only to break SAN ties.
function isInCheck(board, color) {
  const king = color === 'w' ? 'K' : 'k';
  let kIdx = -1;
  for (let i = 0; i < 64; i++) if (board[i] === king) { kIdx = i; break; }
  if (kIdx < 0) return false;
  const kr = Math.floor(kIdx / 8), kf = kIdx % 8;
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p == null || colorOf(p) === color) continue;
    const type = p.toUpperCase();
    if (type === 'P') {
      // pawn attacks toward the king square
      const r = Math.floor(i / 8), f = i % 8;
      const dir = isWhitePiece(p) ? -1 : 1; // white attacks up (row-1)
      if (r + dir === kr && Math.abs(f - kf) === 1) return true;
    } else if (canReach(board, i, kIdx, type)) {
      return true;
    }
  }
  return false;
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

function resolveSan(board, sanRaw, side) {
  const white = side === 'w';
  let s = sanRaw.replace(/[+#!?]/g, '').trim();

  // Castling
  if (s === 'O-O' || s === '0-0') {
    return { from: white ? 'e1' : 'e8', to: white ? 'g1' : 'g8' };
  }
  if (s === 'O-O-O' || s === '0-0-0') {
    return { from: white ? 'e1' : 'e8', to: white ? 'c1' : 'c8' };
  }

  // Promotion suffix
  let promo = null;
  const pm = s.match(/=([QRBN])$/);
  if (pm) { promo = pm[1]; s = s.slice(0, -2); }

  const capture = s.includes('x');
  s = s.replace('x', '');

  let type, rest;
  if ('KQRBN'.includes(s[0])) { type = s[0]; rest = s.slice(1); }
  else { type = 'P'; rest = s; }

  const toName = rest.slice(-2);
  const disamb = rest.slice(0, -2); // '', file, rank, or file+rank
  const to = sq(toName);
  const toR = Math.floor(to / 8), toF = to % 8;

  if (type === 'P') {
    let from;
    if (capture) {
      const srcFile = disamb.charCodeAt(0) - 97;
      const srcRow = white ? toR + 1 : toR - 1;
      from = srcRow * 8 + srcFile;
    } else {
      const oneR = white ? toR + 1 : toR - 1;
      const pawn = white ? 'P' : 'p';
      if (board[oneR * 8 + toF] === pawn) {
        from = oneR * 8 + toF;
      } else {
        const twoR = white ? toR + 2 : toR - 2;
        from = twoR * 8 + toF; // double push
      }
    }
    return { from: name(from), to: toName, promo };
  }

  // Piece move: gather candidates of the right type/color that can reach `to`.
  const want = white ? type : type.toLowerCase();
  let candidates = [];
  for (let i = 0; i < 64; i++) {
    if (board[i] !== want) continue;
    if (canReach(board, i, to, type)) candidates.push(i);
  }

  // Disambiguation by given file and/or rank.
  if (disamb) {
    for (const ch of disamb) {
      if (ch >= 'a' && ch <= 'h') {
        const f = ch.charCodeAt(0) - 97;
        candidates = candidates.filter((i) => i % 8 === f);
      } else if (ch >= '1' && ch <= '8') {
        const r = 8 - Number(ch);
        candidates = candidates.filter((i) => Math.floor(i / 8) === r);
      }
    }
  }

  // Tie-break by legality (pinned pieces can't actually make the move).
  if (candidates.length > 1) {
    const legal = candidates.filter((i) => {
      const b2 = applyMove(board, { from: name(i), to: toName, promo });
      return !isInCheck(b2, side);
    });
    if (legal.length >= 1) candidates = legal;
  }

  if (candidates.length !== 1) {
    throw new Error(`resolveSan: ${sanRaw} -> ${candidates.length} candidates`);
  }
  return { from: name(candidates[0]), to: toName, promo };
}

function applySan(board, san, side) {
  return applyMove(board, resolveSan(board, san, side));
}

// Replay a SAN list from the start position (skips result tokens like "1-0").
function replay(sans) {
  let board = startPosition();
  const positions = [];
  const moves = [];
  let side = 'w';
  for (const raw of sans) {
    if (/^(1-0|0-1|1\/2-1\/2|\*)$/.test(raw.trim())) continue;
    const mv = resolveSan(board, raw, side);
    board = applyMove(board, mv);
    positions.push(board);
    moves.push({ from: mv.from, to: mv.to, san: raw, side, promo: mv.promo || null });
    side = side === 'w' ? 'b' : 'w';
  }
  return { positions, moves };
}

const API = {
  sq, name, emptyBoard, startPosition, applyMove, resolveSan, applySan, replay,
  isInCheck, colorOf, isWhitePiece,
};

if (typeof module !== 'undefined' && module.exports) module.exports = API;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { chess: API }); }
