/**
 * The space a foldable reserves at the top where a fixed `space` is reserved
 * everywhere else: the real top inset — the camera cutout, plus the status bar
 * when it is shown — but never MORE than the fixed space.
 *
 * The cap is what makes this a pure reclaim. Where a foldable's cutout is
 * shallower than the fixed band, the band shrinks to it and the screen starts
 * nearer the top. Where the cutout is as deep or deeper — the Pixel 10 Pro Fold
 * reports 56dp against a 48dp header clearance — the fixed space already worked
 * there, so it is kept exactly.
 *
 * Its own module, with no imports, so the Reader's HTML builder can use it
 * without pulling in anything native.
 */
const foldableTopSpace = (insetTop, space) => Math.min(Math.max(0, Number(insetTop) || 0), space);

export default foldableTopSpace;
