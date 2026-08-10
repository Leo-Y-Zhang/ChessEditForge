'use strict';
/*
 * tools/piece_sheet.js — render every piece (white + black, on light + dark
 * squares) to dist/pieces-sheet.png, plus a big close-up pair of one piece
 * (default N) to dist/piece-big.png, for visual design iteration.
 *
 *   node tools/piece_sheet.js         -> both sheets, big piece = knight
 *   node tools/piece_sheet.js Q       -> big piece = queen
 */
const fs = require('fs');
const { createCanvas } = require('@napi-rs/canvas');
const pieces = require('../src/pieces.js');
const theme = require('../src/theme.js');

const TYPES = ['K', 'Q', 'R', 'B', 'N', 'P'];
const CELL = 300;

function sheet() {
  const W = TYPES.length * CELL, H = 4 * CELL;
  const cv = createCanvas(W, H);
  const ctx = cv.getContext('2d');
  const rows = [
    { isWhite: true, sq: theme.board.dark },
    { isWhite: true, sq: theme.board.light },
    { isWhite: false, sq: theme.board.light },
    { isWhite: false, sq: theme.board.dark },
  ];
  rows.forEach((row, r) => {
    TYPES.forEach((tp, c) => {
      ctx.fillStyle = row.sq;
      ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
      pieces.drawPiece(ctx, tp, row.isWhite, c * CELL + CELL / 2, r * CELL + CELL / 2, CELL, theme, {});
    });
  });
  fs.mkdirSync('dist', { recursive: true });
  fs.writeFileSync('dist/pieces-sheet.png', cv.toBuffer('image/png'));
  console.log('wrote dist/pieces-sheet.png');
}

function big(tp) {
  const S = 640;
  const cv = createCanvas(S * 2, S);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = theme.board.dark;
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = theme.board.light;
  ctx.fillRect(S, 0, S, S);
  pieces.drawPiece(ctx, tp, true, S / 2, S / 2, S, theme, {});
  pieces.drawPiece(ctx, tp, false, S + S / 2, S / 2, S, theme, {});
  fs.writeFileSync('dist/piece-big.png', cv.toBuffer('image/png'));
  console.log('wrote dist/piece-big.png (' + tp + ')');
}

sheet();
big((process.argv[2] || 'N').toUpperCase());
