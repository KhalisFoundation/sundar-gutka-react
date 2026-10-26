import { PAPER_CRUMPLED, PAPER_GRAIN } from "./textures";

// A texture is an SVG data URI pasted straight into a CSS `url()` inside the
// Reader's generated HTML. Two things there are silent failures rather than
// errors: a raw `#` ends the URI at the first colour or filter reference, and
// markup that does not survive the round trip renders nothing at all. Neither
// shows up as an exception; the page simply has no texture.

const decode = (uri) => decodeURIComponent(uri.replace("data:image/svg+xml,", ""));

describe.each([
  ["PAPER_GRAIN", PAPER_GRAIN],
  ["PAPER_CRUMPLED", PAPER_CRUMPLED],
])("%s", (_name, uri) => {
  it("is an svg+xml data URI", () => {
    expect(uri.startsWith("data:image/svg+xml,")).toBe(true);
  });

  it("carries no character that would truncate the url()", () => {
    // `#` is the fragment delimiter, so an unencoded one silently cuts the URI
    // short. Quotes would close the CSS string the same way.
    const payload = uri.slice("data:image/svg+xml,".length);
    expect(payload).not.toMatch(/[#"'<>]/);
  });

  it("round-trips to well-formed svg markup", () => {
    const svg = decode(uri);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.trim().endsWith("</svg>")).toBe(true);
    // Every filter the markup references must be one it also defines, or the
    // rect paints flat and the texture is invisible.
    const referenced = [...svg.matchAll(/filter="url\(#([^)]+)\)"/g)].map((m) => m[1]);
    const defined = [...svg.matchAll(/<filter id="([^"]+)"/g)].map((m) => m[1]);
    expect(referenced.length).toBeGreaterThan(0);
    referenced.forEach((id) => expect(defined).toContain(id));
  });
});

// The two textures are used in opposite ways, and swapping the treatment makes
// each look wrong: a stitched tile stretched over the viewport loses its grain,
// and an unstitched sheet tiled prints a grid of seams.
describe("how a texture is laid down", () => {
  it("stitches PAPER_GRAIN, so it can tile without seams", () => {
    expect(decode(PAPER_GRAIN)).toContain('stitchTiles="stitch"');
  });

  // Unstitched by design, which is what decides how a theme may use it. No
  // bundled theme draws it today; whichever one does must pair it with
  // `no-repeat` and `cover`, because tiling a sheet whose edges do not meet
  // prints a grid of seams and repeats the same crease.
  it("does not stitch PAPER_CRUMPLED — it is one sheet, not a motif", () => {
    expect(decode(PAPER_CRUMPLED)).not.toContain("stitchTiles");
  });

  // It paints its own opaque ground, unlike the fibre tile, so it lightens what
  // it is laid over as well as texturing it. A theme using it therefore has to
  // hold it below full opacity or it replaces the ground rather than marking it.
  it("paints its own opaque base", () => {
    expect(decode(PAPER_CRUMPLED)).toMatch(/<rect[^>]*fill="#faf9f5"/);
  });
});
