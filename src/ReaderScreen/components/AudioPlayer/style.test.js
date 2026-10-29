import darkTheme from "../../../theme/darkTheme";
import lightTheme from "../../../theme/lightTheme";
import errorFallbackStyles from "./components/ErrorFallback/styles";
import loadingStyles from "./components/Loading/styles";
import {
  audioControlBarStyles,
  audioSettingModalStyles,
  minimizePlayerStyles,
  audioTrackDialogStyles,
  MINIMIZED_PLAYER_FOOTPRINT,
  TRACK_ROW_BORDER_WIDTH,
} from "./style";

// The minimized player is a single style object: collapsed it is a 44x44
// circle, expanded it is the pill. Both therefore share whatever shadow the
// style casts.
const container = (theme) => minimizePlayerStyles(theme).container;

describe("minimized audio player elevation", () => {
  describe("dark mode", () => {
    const style = container(darkTheme);

    it("casts no shadow on either platform", () => {
      // shadowOpacity/Radius are iOS-only; elevation is what Android draws.
      // Any of them left non-zero re-introduces the halo.
      expect(style.shadowOpacity).toBe(0);
      expect(style.shadowRadius).toBe(0);
      expect(style.elevation).toBe(0);
      expect(style.shadowOffset).toEqual({ width: 0, height: 0 });
    });

    it("draws no Android elevation, which would be an invisible cost here", () => {
      // The shared dark presets zero the shadow out rather than paying for a
      // render pass nobody can see against a near-black ground.
      expect(style.elevation).toBe(0);
    });

    it("never colours a shadow light, which renders as a glow not a lift", () => {
      // shadowColor tints Android's elevation shadow from API 28 only, so a
      // light value also made the pill look different above and below API 28.
      const light = [darkTheme.c.onPrimary, "#fff", "#ffffff", "#faf9f6"];
      if (style.shadowColor) {
        expect(light).not.toContain(String(style.shadowColor).toLowerCase());
      }
    });

    it("uses the SAME grey as a settings or dashboard card", () => {
      // Not `surfaceElevated`. On that role the player sat a step lighter than
      // every card in the app, so the audio surfaces read as a separate family.
      expect(style.backgroundColor).toBe(darkTheme.c.surface);
    });

    it("still stands clear of the Reader page behind it", () => {
      // Matching the cards must not cost the separation: the surface/background
      // step is what carries depth here, since a black shadow is invisible.
      expect(darkTheme.c.surface).not.toBe(darkTheme.c.background);
    });

    it("carries NO border — depth is the surface step alone", () => {
      // These surfaces used to carry five different border treatments between
      // them, which is what made the player look inconsistent.
      expect(style.borderWidth).toBeFalsy();
      expect(style.backgroundColor).toBe(darkTheme.c.surface);
    });
  });

  it("publishes the collapsed pill's footprint for things that must sit clear of it", () => {
    const { container: pill } = minimizePlayerStyles(darkTheme);
    expect(MINIMIZED_PLAYER_FOOTPRINT).toBe(pill.minHeight + pill.bottom);
  });

  describe("light mode", () => {
    const style = container(lightTheme);

    it("separates from the page with a real shadow, since the surface cannot", () => {
      // Light mode's surface is the same white as the Reader page behind it, so
      // colour alone cannot separate the two. A local preset used to try, at
      // shadowOpacity 0.04 / elevation 1 — invisible in practice, which left the
      // player looking pasted onto the page while dark mode separated fine.
      expect(style.shadowOpacity).toBeGreaterThan(0);
      expect(style.elevation).toBeGreaterThan(0);
    });

    it("takes that depth from the SHARED scale the dashboard cards use", () => {
      // Not a shadow of its own. Two bespoke depth systems lived in this file
      // and neither matched anything else in the app.
      expect(style).toMatchObject(lightTheme.elevation.raised);
      expect(style.borderWidth).toBeFalsy();
    });

    it("needs no theme branch — one surface role serves both modes", () => {
      // The card fill in both. Light mode cannot separate on colour, because
      // this white IS the Reader page, so the shadow above does that job.
      expect(style.backgroundColor).toBe(lightTheme.c.surface);
      expect(container(darkTheme).backgroundColor).toBe(darkTheme.c.surface);
      expect(lightTheme.c.surface).toBe(lightTheme.c.background);
    });
  });
});

// Composite a translucent colour over its background, then measure contrast —
// the sweep sits ON the selected row, so it must be judged against that row's
// fill, not against the dialog behind it.
const parse = (c) => {
  if (c.startsWith("rgb")) {
    const p = c.match(/[\d.]+/g).map(Number);
    return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 };
  }
  const s = c.replace("#", "");
  return { rgb: [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)), a: 1 };
};
const composite = (fg, bg) => {
  const f = parse(fg);
  const b = parse(bg);
  return f.rgb.map((v, i) => Math.round(v * f.a + b.rgb[i] * (1 - f.a)));
};
const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const x = lum(a);
  const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

describe("preview sweep on the artist row", () => {
  // The countdown lives on the row being previewed, not on Next — on the
  // button it read as though Next would fire by itself.
  describe.each([
    ["light", lightTheme],
    ["dark", darkTheme],
  ])("%s mode", (_name, theme) => {
    const styles = audioTrackDialogStyles(theme);
    const rowFill = styles.selectedTrackItem.backgroundColor;

    it("clips the fill on the wrapper, not on the row that holds the icons", () => {
      expect(styles.previewSweepTrack.overflow).toBe("hidden");
      expect(styles.previewSweepTrack.borderRadius).toBe(theme.borderRadius.xl);
      expect(styles.trackItem.overflow).toBeUndefined();
    });

    it("stays flush with the row, which now has no border", () => {
      // The insets are derived from the row border rather than hardcoded, so
      // the sweep cannot drift out of step with it. The border is 0 now, so
      // they are 0 — and if a border ever comes back, they follow it.
      const sweep = styles.previewSweepTrack;
      ["top", "left", "right", "bottom"].forEach((edge) => {
        expect(sweep[edge]).toBe(-TRACK_ROW_BORDER_WIDTH);
      });
      expect(TRACK_ROW_BORDER_WIDTH).toBe(0);
    });

    it("stays visible against the selected row without hiding its label", () => {
      const swept = composite(styles.previewSweepFill.backgroundColor, rowFill);
      // Distinguishable from the untouched part of the row...
      expect(ratio(swept, parse(rowFill).rgb)).toBeGreaterThan(1.2);
      // ...while the artist name on top still clears AA for body text.
      const label = theme.c.onPrimary;
      expect(ratio(parse(label).rgb, swept)).toBeGreaterThanOrEqual(4.5);
    });
  });

  it("no longer draws a countdown on the Next button", () => {
    const styles = audioTrackDialogStyles(darkTheme);
    expect(styles.previewProgressTrack).toBeUndefined();
    expect(styles.previewProgressFill).toBeUndefined();
  });
});

// The player is assembled from several style modules, and every one of them
// draws a piece of the SAME floating surface: the bar, the full player, the
// expansion behind Audios/Options, the settings panel, and the loading and
// error panels that stand in place of the player entirely.
//
// They had drifted between `surface` and `surfaceElevated`. That is invisible in
// light mode, where both roles resolve to the same white, so it survived review
// — but in dark mode the two are a full step apart (#1c1e21 against #26282c),
// and the loading panel appears for only as long as a track buffers. The result
// was a player that twitched a step darker, toward the Reader ground, on every
// load and then corrected itself.
//
// This asserts they agree rather than asserting a specific colour, so it holds
// if the ladder is ever retuned, and fails the moment a new player surface
// reaches for the wrong role.
describe("the audio player is ONE surface", () => {
  it.each([
    ["light", lightTheme],
    ["dark", darkTheme],
  ])("[%s] every panel that replaces or extends the player agrees", (_name, theme) => {
    // The SAME fill as a Settings or Dashboard card — the player is part of the
    // same family, not a lighter thing floating above it.
    const expected = theme.c.surface;

    expect(audioControlBarStyles(theme).mainContainer.backgroundColor).toBe(expected);
    expect(audioControlBarStyles(theme).modalAnimation.backgroundColor).toBe(expected);
    expect(audioSettingModalStyles(theme).settingsModalContainer.backgroundColor).toBe(expected);
    expect(minimizePlayerStyles(theme).container.backgroundColor).toBe(expected);
    expect(loadingStyles(theme).loadingContainer.backgroundColor).toBe(expected);
    expect(errorFallbackStyles(theme).statusContainer.backgroundColor).toBe(expected);
  });

  it("dark mode really does separate the player from the Reader ground", () => {
    // The twitch was only visible because two greys were in play at all.
    expect(darkTheme.c.surface).not.toBe(darkTheme.c.background);
  });

  it("light mode separates with a shadow, because the fill cannot", () => {
    // Here `surface` IS the Reader page white, so depth has to come from the
    // shared elevation preset — the same way a dashboard card does it.
    expect(lightTheme.c.surface).toBe(lightTheme.c.background);
    expect(lightTheme.elevation.raised.shadowOpacity).toBeGreaterThan(0);
  });
});

// The reciter's name and the clock share one row, and the name is sized from
// whatever the clock leaves it. So the clock's width must be a constant, not a
// function of the digits currently on screen — otherwise a borderline name
// flips between one line and two AS THE TRACK PLAYS, which is exactly what was
// reported: the name "fluctuating" with nothing on screen being touched.
describe("the playing clock reserves a constant width", () => {
  it.each([
    ["light", lightTheme],
    ["dark", darkTheme],
  ])("[%s] holds its width whatever the digits are", (_name, theme) => {
    const { timestamp } = audioControlBarStyles(theme);

    // Proportional digits made "0:11" narrower than "0:09" — a couple of px of
    // the name's room, handed back and taken away every second.
    expect(timestamp.fontVariant).toContain("tabular-nums");
    // formatTime writes "9:59" then "10:00": four characters become five part
    // way through a recitation. The widest clock is reserved up front so that
    // jump costs the name nothing.
    expect(timestamp.minWidth).toBeGreaterThanOrEqual(timestamp.fontSize * 2.5);
    // Reserved space opens on the LEFT, so the seconds stay put.
    expect(timestamp.textAlign).toBe("right");
  });

  it.each([
    ["light", lightTheme],
    ["dark", darkTheme],
  ])("[%s] gives that row the full width to share", (_name, theme) => {
    // It took 90% and centred itself, and this is the row where a tenth of the
    // width is the difference between the name fitting and wrapping.
    expect(audioControlBarStyles(theme).trackInfo.width).toBe("100%");
  });
});
