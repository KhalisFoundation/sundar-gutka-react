/* eslint-disable */
// Ported verbatim from the Uchaaran design app; kept byte-faithful so the tested screens are what ships.
// Source: Sundar Gutka src/theme/{lightTheme,darkTheme,typography}.js,
// origin/master e949f2f. Keep the host's useTheme() authoritative in native integration.
export const light = {
  primary: '#113979', surface: '#ffffff', text: '#121212', gold: '#DEBB0A',
  subtle: '#faf9f6', secondary: '#666666', action: '#D3E1F7', separator: '#eeeeee',
  success: '#e9f2e8', successText: '#285e38', retry: '#fbe9e4', retryText: '#9c382c'
};
export const dark = {
  primary: '#113979', surface: '#121212', text: '#faf9f6', gold: '#99852c',
  subtle: '#232323', secondary: '#b7bdc6', action: '#121F35', separator: '#35404e',
  success: '#1d3526', successText: '#a5d9b3', retry: '#3d2523', retryText: '#f4b4ab'
};
export const font = 'BalooPaaji2-Regular';
export const bold = 'BalooPaaji2-SemiBold';
export const legacyFont = 'GurbaniAkharTrue';

/**
 * Baloo Paaji 2 reserves 1.771x its size for ascent + descent (1157 + 614 per
 * 1000 em). Gurmukhi lives in that headroom: tippi, bindi and addak sit above
 * the headline, pairin letters hang below it. A browser lets a glyph spill past
 * a short line box, so the web prototype got away with hand-picked values; iOS
 * sets NSParagraphStyle min/max to lineHeight and clips whatever overflows.
 * Derive it instead of guessing.
 */
export const LINE_RATIO = 1.78;
export const line = (size) => Math.round(size * LINE_RATIO);

/** Symbols (star, chevron) come from a system fallback with tighter metrics. */
export const symbolLine = (size) => Math.round(size * 1.25);
