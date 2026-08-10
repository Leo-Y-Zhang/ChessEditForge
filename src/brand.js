'use strict';
/*
 * brand.js — the channel identity watermarked on every edit.
 *
 * Set CHESS_EDIT_BRAND_NAME and CHESS_EDIT_BRAND_HANDLE to rebrand every edit at
 * once, or edit the defaults below. The defaults are deliberately generic: this
 * repository is the factory, not any particular channel that runs on it.
 */
const env = (typeof process !== 'undefined' && process.env) || {};
const BRAND = {
  name: env.CHESS_EDIT_BRAND_NAME || 'Example',
  handle: env.CHESS_EDIT_BRAND_HANDLE || '@example.chess',
};

if (typeof module !== 'undefined' && module.exports) module.exports = BRAND;
else { (typeof window !== 'undefined' ? window : globalThis).CEF =
  Object.assign((typeof window !== 'undefined' ? window : globalThis).CEF || {}, { brand: BRAND }); }
