import React from "react";

import { render, fireEvent } from "@testing-library/react-native";
import { ALL_THEMES as READER_THEMES } from "@theme/reader/__fixtures__/allThemes";
import { remoteThemeRows } from "@theme/reader/__fixtures__/remoteThemes";
import { mergeThemeRegistry } from "@theme/reader/registry";

import { getMockDispatch, setMockState } from "@common/test-utils/mocks/react-redux";

import { themeOptions } from "./options";
import ThemePreview from "./ThemePreview";

import Themes from "./index";

jest.mock("@common/actions", () => ({
  applyTheme: jest.fn((value) => ({ type: "SET_THEME", value })),
}));

// The shared @common mock covers SafeArea, StatusBarComponent and the common
// strings, but not the divider (a native gradient) or this screen's own strings.
// react-native-localization reads a native module at import time, so the real
// STRINGS cannot be loaded here; these mirror the en-US block.
jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  const base = createCommonMock();
  return {
    ...base,
    GradientDivider: () => null,
    STRINGS: {
      ...base.STRINGS,
      cancel: "Cancel",
      GO_BACK: "Go back",
      theme: "Theme",
      theme_hint: "A theme sets the app's appearance and the reading page together.",
      theme_selected: "Selected",
      default: "System default",
      light: "Light",
      dark: "Dark",
    },
  };
});

const { applyTheme } = require("@common/actions");

// The live registry: bundled light/dark plus the themes the backend serves.
// themeOptions(MERGED) on its own would see only the two the app ships with.
const MERGED = mergeThemeRegistry({ themes: remoteThemeRows });

const navigation = { goBack: jest.fn() };
const open = () => render(<Themes navigation={navigation} />);

// System, Light and Dark come first; the designed themes follow.
const FIRST_DESIGNED = 3;

describe("Theme picker", () => {
  const dispatch = getMockDispatch();

  beforeEach(() => {
    jest.clearAllMocks();
    // The designed themes are SERVED, so the picker only sees them once the
    // synced slice is in the store — that is what useThemeRegistry reads.
    setMockState({ theme: "Default", remoteThemes: { themes: remoteThemeRows } });
  });

  it("offers System, Light, Dark and every designed theme", () => {
    // Iterating the registry is what makes a new theme appear here for free —
    // the "easily extensible" requirement, held by a test rather than a promise.
    // System + Light + Dark, then the designed ones (the registry's light and
    // dark records back the appearance tiles rather than adding their own).
    const { getAllByRole } = open();
    expect(getAllByRole("radio")).toHaveLength(READER_THEMES.length + 1);
  });

  it("applies EVERY tile on a single tap, with no confirm step", () => {
    // The tile is the preview, and the change is instant and reversible, so a
    // confirm step only added a tap. Designed themes are no different.
    const options = themeOptions(MERGED);
    const { getAllByRole } = open();
    getAllByRole("radio").forEach((tile, i) => {
      fireEvent.press(tile);
      expect(applyTheme).toHaveBeenCalledWith(options[i].value);
    });
    expect(dispatch).toHaveBeenCalled();
  });

  it("applies a designed theme on the same single tap", () => {
    const { getAllByRole } = open();
    fireEvent.press(getAllByRole("radio")[FIRST_DESIGNED]);
    expect(applyTheme).toHaveBeenCalledWith(themeOptions(MERGED)[FIRST_DESIGNED].value);
  });

  it("marks the stored selection, whichever kind of value it is", () => {
    [
      ["Default", /System default/i],
      ["Dark", /Dark/i],
      ["puratan", /Puratan/i],
    ].forEach(([stored, label]) => {
      setMockState({ theme: stored });
      const { getAllByRole, unmount } = open();
      const selected = getAllByRole("radio").filter((n) => n.props.accessibilityState?.selected);
      expect(selected).toHaveLength(1);
      expect(selected[0].props.accessibilityLabel).toMatch(label);
      unmount();
    });
  });
});

describe("themeOptions", () => {
  it("puts System first and previews it from no single record", () => {
    const [first] = themeOptions(MERGED);
    expect(first.value).toBe("Default");
    expect(first.record).toBeNull();
  });

  it("maps the appearance keywords onto the light and dark records", () => {
    // The stored keyword is capitalised and long-persisted ("Light"); the
    // record's id is lowercase ("light"). Keeping the mapping in one place means
    // the storage format never has to change.
    const byValue = Object.fromEntries(themeOptions(MERGED).map((o) => [o.value, o]));
    expect(byValue.Light.record.id).toBe("light");
    expect(byValue.Dark.record.id).toBe("dark");
  });

  it("stores a designed theme under its own id", () => {
    const puratan = themeOptions(MERGED).find((o) => o.value === "puratan");
    expect(puratan.record.id).toBe("puratan");
  });
});

describe("ThemePreview", () => {
  it("draws the Ik Onkar with the same ligature as the home screen's invocation", () => {
    // "<>" in the Gurbani face is the one rendering with the full elongated
    // stroke over the onkar — the glyph BaniHeader draws. The Unicode ੴ
    // decomposes in that face and flattens in Baloo, so the tile would show a
    // different symbol from the screen it is two taps away from.
    const { SAMPLE } = require("./ThemePreview");
    expect(SAMPLE.heading).toBe("<>");
  });

  it("renders a tile for every theme without touching the app theme", () => {
    // The thumbnails are generated from the theme record alone, so a new theme
    // brings its own preview and the two can never fall out of sync.
    READER_THEMES.forEach((theme) => {
      expect(() => render(<ThemePreview theme={theme} />)).not.toThrow();
    });
  });

  it("keeps the sample clear of the frame on every framed theme", () => {
    // The tile used a flat 12px padding while the rules sat at the theme's full
    // `inset`, so on Puratan the sample ran straight over them. The gutter is
    // derived from the frame now — the same invariant the Reader's own
    // borderCss holds, checked here at tile scale.
    const { frameGeometry } = require("./ThemePreview");
    READER_THEMES.filter((t) => t.border.width > 0).forEach((theme) => {
      const { innermost, gutter, ruleWidth } = frameGeometry(theme.border);
      expect(gutter).toBeGreaterThan(innermost + ruleWidth);
    });
  });

  it("scales a frame down to the tile instead of using screen insets", () => {
    // A 12px inset is proportionally ~7x larger on a 175dp tile than on a
    // phone screen, which is what let Puratan's frame swallow the sample.
    const { frameGeometry } = require("./ThemePreview");
    const puratan = READER_THEMES.find((t) => t.id === "puratan");
    expect(frameGeometry(puratan.border).innermost).toBeLessThan(puratan.border.inset);
  });

  it("degrades an SVG texture to the theme's flat ground", () => {
    // React Native's Image decodes raster formats only. An SVG data URI — which
    // the WebView renders happily for Puratan's paper grain — would fail to load
    // and leave an empty layer, so the tile falls back to colour, type and frame.
    const { isRenderableInRN } = require("./ThemePreview");
    expect(isRenderableInRN("data:image/svg+xml,%3Csvg%3E")).toBe(false);
    expect(isRenderableInRN(42)).toBe(true);
    expect(isRenderableInRN("https://example.com/paper.png")).toBe(true);
    expect(isRenderableInRN(null)).toBe(false);
  });
});
