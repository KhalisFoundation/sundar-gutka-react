// Background textures, as inline SVG data URIs.
//
// Deliberately NOT bundled binary assets. A data URI:
//   • needs no @1x/@2x/@3x matrix, so iOS and Android cannot drift apart;
//   • sidesteps the Android release-build asset-resolution difference that makes
//     a require()d image load inside a WebView in debug but fail in release;
//   • costs a few hundred bytes instead of tens of kilobytes, which matters on
//     the low-end devices this app still supports;
//   • is resolution-independent — feTurbulence regenerates at any density.
//
// A theme's `background.image` may equally be a plain URL or a require()d asset;
// gutkahtml.js resolves whatever it is handed. These are simply what v1 ships.

const svgDataUri = (markup) => `data:image/svg+xml,${encodeURIComponent(markup.trim())}`;

// Fine fractal grain, fully desaturated — reads as laid-paper fibre when tiled
// at low opacity over a parchment ground.
export const PAPER_GRAIN = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140">
  <filter id="g">
    <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="140" height="140" filter="url(#g)"/>
</svg>`);

// A whole sheet of crumpled paper: soft directional lighting over low-frequency
// turbulence makes continuous folds, with a second finer turbulence for grain.
//
// Used as ONE covering sheet, not a tile. It has no `stitchTiles`, so its edges
// do not meet, and its folds are a composition across the whole 800x800 box
// rather than a motif — tiling it would print a visible grid of seams and
// repeat the same crease every 140px. A theme pairs it with `no-repeat` and
// `cover`; the viewBox gives it a 1:1 aspect ratio for that to scale against.
//
// Unlike PAPER_GRAIN this paints its own opaque ground (#faf9f5), so it lightens
// whatever it is laid over as well as texturing it. That is what makes the
// folds read: the lit faces go bright and the creases stay near the ground
// colour. `imageOpacity` sets how far the sheet is allowed to take over.
export const PAPER_CRUMPLED = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <defs>
    <!-- Smooth paper noise & fine crumple lighting -->
    <filter id="white-crumple" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
      <!-- High-frequency turbulence for tiny paper grain -->
      <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="6" result="noise" />

      <!-- Soft directional diffuse lighting to form continuous folds -->
      <feDiffuseLighting in="noise" lighting-color="#ffffff" surfaceScale="3.5" result="light">
        <feDistantLight azimuth="45" elevation="40" />
      </feDiffuseLighting>

      <!-- Smooth contrast adjustment to prevent harsh line breaks -->
      <feComponentTransfer>
        <feFuncR type="linear" slope="0.75" intercept="0.25" />
        <feFuncG type="linear" slope="0.75" intercept="0.25" />
        <feFuncB type="linear" slope="0.75" intercept="0.25" />
      </feComponentTransfer>
    </filter>

    <!-- Secondary micro-texture layer -->
    <filter id="fine-grain" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="grain" />
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.07 0" />
    </filter>
  </defs>

  <!-- Solid off-white base layer to prevent any background leaks -->
  <rect width="100%" height="100%" fill="#faf9f5" />

  <!-- Main textured fold layer -->
  <rect width="100%" height="100%" filter="url(#white-crumple)" />

  <!-- Subtle fine-grain paper overlay for a soft vintage feel -->
  <rect width="100%" height="100%" filter="url(#fine-grain)" opacity="0.6" />
</svg>`);

export default { PAPER_GRAIN, PAPER_CRUMPLED };
