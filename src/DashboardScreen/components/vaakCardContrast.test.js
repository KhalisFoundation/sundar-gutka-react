/* eslint-env jest */
import { contrastRatio, AA_CONTRAST } from "@theme/reader/contrast";
import { paletteFor } from "@theme/screenPalettes";

// The Hukamnama and Random Shabad cards draw their own dark ground on top of the
// Dashboard, so every colour on them has to be measured against the CARD, not
// against the page behind it.
//
// The Ang line got this wrong: it used `mutedText`, which is the screen's muted
// ink and is paired with the light page. On the card it fell to 2.42:1 in light
// mode, well under AA, which is why the Ang and its number were hard to read
// there but fine in dark mode. `onVaakCardMuted` is the same role measured
// against this card.
//
// Pinned for every mode a card can be drawn in, because the two colours are
// re-derived together per designed theme and nothing else would catch them
// drifting apart.

const MODES = ["light", "dark"];

describe("the vaak card's own ink", () => {
  it.each(MODES)("keeps muted text readable on the card in %s mode", (mode) => {
    const p = paletteFor("dashboard", mode);

    expect(contrastRatio(p.onVaakCardMuted, p.vaakCardBg)).toBeGreaterThanOrEqual(AA_CONTRAST);
  });

  it.each(MODES)("keeps the card's primary ink readable in %s mode", (mode) => {
    const p = paletteFor("dashboard", mode);

    expect(contrastRatio(p.onVaakCard, p.vaakCardBg)).toBeGreaterThanOrEqual(AA_CONTRAST);
  });

  it("shows why the screen's muted ink cannot be used on the card", () => {
    // The regression itself, kept as the reason the line reads the way it does.
    // If this ever starts passing, `mutedText` became safe on the card and this
    // test should go rather than be worked around.
    const light = paletteFor("dashboard", "light");

    expect(contrastRatio(light.mutedText, light.vaakCardBg)).toBeLessThan(AA_CONTRAST);
  });
});

describe("a designed theme keeps the pair together", () => {
  // paletteFor re-derives the card and its ink from the theme's own colours, so
  // a backend-served theme must not be able to land an unreadable combination.
  const designed = {
    mode: "light",
    designedTheme: "puratan",
    c: {
      background: "#F2E6CA",
      surface: "#E8D9B8",
      textPrimary: "#2E1F0F",
      textSecondary: "#5A4630",
      accent: "#8A5A2B",
      onAccent: "#FFFFFF",
      border: "#C9B68F",
    },
  };

  it("keeps muted text on the card at AA", () => {
    const p = paletteFor("dashboard", designed);

    expect(contrastRatio(p.onVaakCardMuted, p.vaakCardBg)).toBeGreaterThanOrEqual(AA_CONTRAST);
  });

  it("keeps primary text on the card at AA", () => {
    const p = paletteFor("dashboard", designed);

    expect(contrastRatio(p.onVaakCard, p.vaakCardBg)).toBeGreaterThanOrEqual(AA_CONTRAST);
  });
});
