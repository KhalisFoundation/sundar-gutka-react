/* eslint-env jest */
/**
 * A theme may carry a Bani font of its own. Choosing it applies that face;
 * leaving it puts the reader's own back. A theme with no face leaves the font
 * alone — including one that arrived from another device through settings sync.
 */
import { applyTheme } from "./actions";
import * as actionTypes from "./actions/actionTypes";

jest.mock("./firebase/analytics", () => ({
  trackSettingEvent: jest.fn(),
  trackBaniArtistDefault: jest.fn(),
}));
jest.mock("./localization", () => ({ __esModule: true, default: {} }));
jest.mock("@theme/reader/registry", () => ({
  mergeThemeRegistry: () => ({
    byId: {
      light: {},
      dark: {},
      manuscript: { typography: { preferredFontFace: "AnmolLipiSG" } },
    },
  }),
}));

const run = (initial, themeId) => {
  let state = { readerThemeSeeded: {}, ...initial };
  const dispatched = [];
  const dispatch = (action) => {
    dispatched.push(action);
    if (action.type === actionTypes.SET_THEME) state = { ...state, theme: action.value };
    if (action.type === actionTypes.SET_BANI_FONT_FACE) {
      state = { ...state, baniFontFace: action.value };
    }
    if (action.type === actionTypes.SET_OWN_BANI_FONT_FACE) {
      state = { ...state, ownBaniFontFace: action.value };
    }
  };
  applyTheme(themeId)(dispatch, () => state);
  return { state, dispatched };
};

const fontWrites = (dispatched) =>
  dispatched.filter((a) => a.type === actionTypes.SET_BANI_FONT_FACE);

it("applies the face of a theme that has one", () => {
  const { state } = run({ theme: "light", baniFontFace: "GurbaniAkharTrue" }, "manuscript");
  expect(state.baniFontFace).toBe("AnmolLipiSG");
});

it("puts the reader's own face back on leaving that theme", () => {
  const chosen = run({ theme: "light", baniFontFace: "GurbaniAkharTrue" }, "manuscript").state;
  const { state } = run(chosen, "dark");
  expect(state.baniFontFace).toBe("GurbaniAkharTrue");
});

// Device A picks Anmol Lipi; it syncs to B, whose recorded own face was an
// older choice. A change between two faceless themes on B put that older
// choice back and sent it to the account as a fresh edit, so the two devices
// flipped the font back and forth.
it("leaves a font synced from another device alone on a change between plain themes", () => {
  const { state, dispatched } = run(
    { theme: "light", baniFontFace: "AnmolLipiSG", ownBaniFontFace: "GurbaniAkharHeavyTrue" },
    "dark"
  );
  expect(fontWrites(dispatched)).toHaveLength(0);
  expect(state.baniFontFace).toBe("AnmolLipiSG");
  // And it is now the face a theme with one of its own gives back.
  expect(state.ownBaniFontFace).toBe("AnmolLipiSG");
});
