import { ALL_THEMES_BY_ID as READER_THEMES_BY_ID } from "@theme/reader/__fixtures__/allThemes";
import { remoteThemeRows } from "@theme/reader/__fixtures__/remoteThemes";
import { applyTheme, chooseBaniFontFace } from "./actions";
import * as actionTypes from "./actions/actionTypes";
import constant from "./constant";
import { trackSettingEvent } from "./firebase/analytics";
import rootReducer from "./reducer";

// The app's single theme setting and its seed-once rule. Both are persisted, so
// getting either wrong is a bug the user cannot clear without reinstalling.
//
// The mocks below sit under the imports because Babel hoists jest.mock above
// them regardless, so the imports still resolve to the mocked modules.

jest.mock("./firebase/analytics", () => ({
  trackSettingEvent: jest.fn(),
  trackBaniArtistDefault: jest.fn(),
}));

// react-native-localization reads a native module at import time, which Jest has
// no bridge for. The actions file imports STRINGS; this suite uses none of them.
jest.mock("./localization", () => ({ __esModule: true, default: {} }));

const initial = () => rootReducer(undefined, { type: "@@INIT" });

// Runs the thunk against a fixed state and reports what it dispatched.
// Puratan and the rest are SERVED now, so the state carries the synced slice —
// without it the merge sees only light and dark and the thunk has no record to
// seed from. This is the shape a device holds after a theme sync.
// No shipped theme seeds a setting any more — Puratan used to turn
// transliteration on and no longer does — but the mechanism is still there for
// one that wants it, so it gets a subject of its own rather than losing its
// coverage. Served like any other theme.
const SEEDING_THEME = {
  id: "seedy",
  position: 90,
  enabled: true,
  names: { "en-US": "Seedy" },
  record: {
    base: "light",
    palette: { ground: "#FFFFFF", ink: "#111111", accent: "#7A2E2E" },
    defaults: { isTransliteration: true },
  },
};

const run = (id, state = {}) => {
  const dispatched = [];
  const dispatch = (action) => {
    dispatched.push(action);
    return action;
  };
  applyTheme(id)(dispatch, () => ({
    remoteThemes: { themes: [...remoteThemeRows, SEEDING_THEME] },
    ...state,
  }));
  return dispatched;
};

describe("theme reducer", () => {
  it("defaults to following the device", () => {
    // Unchanged from before the themes existed, so an installed user who never
    // opens the picker sees exactly what they saw yesterday.
    expect(initial().theme).toBe(constant.Default);
    expect(initial().readerThemeSeeded).toEqual({});
  });

  it("stores the chosen id", () => {
    const next = rootReducer(undefined, { type: actionTypes.SET_THEME, value: "puratan" });
    expect(next.theme).toBe("puratan");
  });

  it("stores a designed theme id in the same key as an appearance keyword", () => {
    // ONE setting holds both kinds of value. A designed id additionally implies
    // an appearance, which resolve.js reads off the record — see appearanceFor.
    expect(rootReducer(undefined, { type: actionTypes.SET_THEME, value: "blue" }).theme).toBe(
      "blue"
    );
    expect(
      rootReducer(undefined, { type: actionTypes.SET_THEME, value: constant.Dark }).theme
    ).toBe(constant.Dark);
  });

  it("accumulates seeded ids rather than replacing the map", () => {
    let state = rootReducer(undefined, {
      type: actionTypes.MARK_READER_THEME_SEEDED,
      value: "puratan",
    });
    state = rootReducer(state, { type: actionTypes.MARK_READER_THEME_SEEDED, value: "kesari" });
    expect(state.readerThemeSeeded).toEqual({ puratan: true, kesari: true });
  });
});

describe("applyTheme", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sets the theme and reports it once", () => {
    const types = run("blue").map((a) => a.type);
    expect(types).toContain(actionTypes.SET_THEME);
    expect(trackSettingEvent).toHaveBeenCalledTimes(1);
  });

  it("seeds a theme's suggested settings the first time only", () => {
    const first = run("seedy", { isTransliteration: false, readerThemeSeeded: {} });
    expect(
      first.some((a) => a.type === actionTypes.TOGGLE_TRANSLITERATION && a.value === true)
    ).toBe(true);
    expect(first.some((a) => a.type === actionTypes.MARK_READER_THEME_SEEDED)).toBe(true);
  });

  it("no shipped theme seeds a setting — a font is a look, a toggle is a choice", () => {
    Object.values(READER_THEMES_BY_ID).forEach((theme) => {
      expect(theme.defaults).toEqual({});
    });
  });

  it("never re-seeds a SETTING, so a later manual toggle is permanent", () => {
    // The user turned transliteration back off after first picking the theme.
    // Re-selecting it must not undo that.
    const again = run("seedy", {
      isTransliteration: false,
      readerThemeSeeded: { seedy: true },
    });
    expect(again.map((a) => a.type)).toEqual([actionTypes.SET_THEME]);
  });

  it("does not re-assert a toggle that already holds the desired value", () => {
    // Dispatching it anyway would emit a misleading analytics event for a change
    // that never happened.
    const acts = run("puratan", { isTransliteration: true, readerThemeSeeded: {} });
    expect(acts.some((a) => a.type === actionTypes.TOGGLE_TRANSLITERATION)).toBe(false);
    expect(acts.some((a) => a.type === actionTypes.MARK_READER_THEME_SEEDED)).toBe(true);
  });

  it("applies a theme's Bani font when it is chosen", () => {
    const acts = run("puratan", { baniFontFace: "GurbaniAkharTrue", readerThemeSeeded: {} });
    expect(
      acts.some((a) => a.type === actionTypes.SET_BANI_FONT_FACE && a.value === "AnmolLipiSG")
    ).toBe(true);
  });

  it("applies it AGAIN every time the theme is chosen, unlike a seeded setting", () => {
    // The face is part of how the theme looks, so coming back to Puratan brings
    // Anmol Lipi back with it — even though the theme has been selected before
    // and its once-only seeding is long done.
    const acts = run("puratan", {
      baniFontFace: "GurbaniAkharTrue",
      readerThemeSeeded: { puratan: true },
    });
    expect(
      acts.some((a) => a.type === actionTypes.SET_BANI_FONT_FACE && a.value === "AnmolLipiSG")
    ).toBe(true);
  });

  it("does not re-assert the face the user is already reading in", () => {
    // Nothing changed, so dispatching would only emit a misleading analytics
    // event for a change that never happened.
    const acts = run("puratan", {
      baniFontFace: "AnmolLipiSG",
      readerThemeSeeded: { puratan: true },
    });
    expect(acts.some((a) => a.type === actionTypes.SET_BANI_FONT_FACE)).toBe(false);
  });

  it("leaves the user's own face alone for a theme that suggests none", () => {
    // Sanjh states a palette and nothing else. Choosing it must not disturb a
    // font the reader picked for themselves.
    const acts = run("sanjh", {
      baniFontFace: "GurbaniAkharTrue",
      readerThemeSeeded: { sanjh: true },
    });
    expect(acts.some((a) => a.type === actionTypes.SET_BANI_FONT_FACE)).toBe(false);
  });

  // A theme that set a face does not keep it after the reader leaves: a theme
  // with no face of its own puts the reader's OWN face back.
  describe("leaving a theme that set the Bani font", () => {
    const faceSet = (acts) =>
      acts.filter((a) => a.type === actionTypes.SET_BANI_FONT_FACE).map((a) => a.value);
    const ownSet = (acts) =>
      acts.filter((a) => a.type === actionTypes.SET_OWN_BANI_FONT_FACE).map((a) => a.value);

    it("restores the face the reader picked for themselves", () => {
      const acts = run("sanjh", {
        theme: "puratan",
        baniFontFace: "AnmolLipiSG",
        ownBaniFontFace: "GurbaniAkharTrue",
        readerThemeSeeded: { sanjh: true },
      });
      expect(faceSet(acts)).toEqual(["GurbaniAkharTrue"]);
    });

    it("restores it for a plain appearance too", () => {
      const acts = run(constant.Light, {
        theme: "puratan",
        baniFontFace: "AnmolLipiSG",
        ownBaniFontFace: "GurbaniAkharTrue",
        readerThemeSeeded: {},
      });
      expect(faceSet(acts)).toEqual(["GurbaniAkharTrue"]);
    });

    // A reader who never picked a font in Settings has none recorded. The face
    // they read in outside a font-setting theme can only be theirs, so it is
    // remembered on the way in — and a later exit has something to restore.
    it("remembers the face in use when entering from a theme that set none", () => {
      const acts = run("puratan", {
        theme: "sanjh",
        baniFontFace: "GurbaniAkharThickTrue",
        readerThemeSeeded: { puratan: true },
      });
      expect(ownSet(acts)).toEqual(["GurbaniAkharThickTrue"]);
      expect(faceSet(acts)).toEqual(["AnmolLipiSG"]);
    });

    it("never mistakes a theme's face for the reader's own", () => {
      const acts = run("sanjh", {
        theme: "puratan",
        baniFontFace: "AnmolLipiSG",
        readerThemeSeeded: { sanjh: true },
      });
      expect(ownSet(acts)).toEqual([]);
      expect(faceSet(acts)).toEqual([]);
    });

    it("does not overwrite a face the reader already picked", () => {
      const acts = run("puratan", {
        theme: "sanjh",
        baniFontFace: "GurbaniAkharTrue",
        ownBaniFontFace: "GurbaniAkharTrue",
        readerThemeSeeded: { puratan: true },
      });
      expect(ownSet(acts)).toEqual([]);
    });
  });

  it("marks a theme with no defaults as seeded, so the check short-circuits after", () => {
    const acts = run("blue", { readerThemeSeeded: {} });
    expect(acts.map((a) => a.type)).toEqual([
      actionTypes.SET_THEME,
      actionTypes.MARK_READER_THEME_SEEDED,
    ]);
  });

  it("never seeds anything for a plain appearance", () => {
    // Default, Light and Dark are not theme records and must never touch a
    // user's translation or transliteration setup.
    [constant.Default, constant.Light, constant.Dark].forEach((value) => {
      const acts = run(value, { isTransliteration: false, readerThemeSeeded: {} });
      expect(acts.some((a) => a.type === actionTypes.TOGGLE_TRANSLITERATION)).toBe(false);
    });
  });

  it("survives an id it does not recognise", () => {
    // A theme withdrawn in a later release. Resolution falls back at read time;
    // this must not throw on the way in.
    expect(() => run("khalsa-gold", { readerThemeSeeded: {} })).not.toThrow();
  });
});

describe("chooseBaniFontFace", () => {
  it("applies the face and remembers it as the reader's own", () => {
    const dispatched = [];
    chooseBaniFontFace("AnmolLipiSG")((action) => dispatched.push(action));
    expect(dispatched.map((a) => [a.type, a.value])).toEqual([
      [actionTypes.SET_BANI_FONT_FACE, "AnmolLipiSG"],
      [actionTypes.SET_OWN_BANI_FONT_FACE, "AnmolLipiSG"],
    ]);
  });

  it("starts with no face of the reader's own, and keeps the one recorded", () => {
    expect(initial().ownBaniFontFace).toBeNull();
    const next = rootReducer(initial(), {
      type: actionTypes.SET_OWN_BANI_FONT_FACE,
      value: "GurbaniAkharTrue",
    });
    expect(next.ownBaniFontFace).toBe("GurbaniAkharTrue");
  });
});
