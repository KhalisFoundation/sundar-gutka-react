import constant from "@common/constant";
import { ALL_THEMES_BY_ID as READER_THEMES_BY_ID } from "./__fixtures__/allThemes";
import resolveReaderTheme, { appearanceFor, isDesignedTheme } from "./resolve";

// ONE setting — `state.theme` — decides two things: which appearance the app
// wears, and which record the Bani is rendered with. These are the rules that
// keep those two from ever disagreeing.

describe("appearanceFor", () => {
  it("pairs each designed theme with the appearance it is meant to be read in", () => {
    // Declared once, in the record's `base`. Choosing Blue puts the whole app in
    // dark; Puratan and Kesari put it in light. Nothing else encodes the pairing.
    //
    // The registry is passed explicitly because these five are SERVED, not
    // bundled — which is what ThemeProvider and useReaderTheme do in production
    // via useThemeRegistry. The default argument is the bundled map, and that
    // now holds light and dark alone.
    expect(appearanceFor("blue", READER_THEMES_BY_ID)).toBe("dark");
    expect(appearanceFor("sanjh", READER_THEMES_BY_ID)).toBe("dark");
    expect(appearanceFor("puratan", READER_THEMES_BY_ID)).toBe("light");
    expect(appearanceFor("kesari", READER_THEMES_BY_ID)).toBe("light");
    expect(appearanceFor("white", READER_THEMES_BY_ID)).toBe("light");
  });

  it("returns null for the plain appearance keywords", () => {
    // ThemeProvider then applies its own Default/Light/Dark rules, unchanged.
    [constant.Default, constant.Light, constant.Dark].forEach((value) =>
      expect(appearanceFor(value)).toBeNull()
    );
  });

  it("returns null for an id it does not know", () => {
    // A theme withdrawn in a later release degrades to normal light/dark
    // handling rather than leaving the app with no appearance at all.
    expect(appearanceFor("khalsa-gold")).toBeNull();
    expect(appearanceFor(undefined)).toBeNull();
  });
});

describe("isDesignedTheme", () => {
  it("separates designed themes from appearance keywords", () => {
    expect(isDesignedTheme("puratan", READER_THEMES_BY_ID)).toBe(true);
    expect(isDesignedTheme(constant.Dark)).toBe(false);
    expect(isDesignedTheme(constant.Default)).toBe(false);
    expect(isDesignedTheme("nonsense")).toBe(false);
  });

  it("does not mistake an appearance keyword for its lowercase record", () => {
    // The stored keyword is "Light"; the record's id is "light". They must not
    // collide, or picking Light would look like picking a designed theme.
    expect(isDesignedTheme(constant.Light)).toBe(false);
  });
});

describe("resolveReaderTheme", () => {
  it("renders a designed theme with its own record", () => {
    expect(resolveReaderTheme("puratan", false, READER_THEMES_BY_ID)).toBe(
      READER_THEMES_BY_ID.puratan
    );
    // Blue pairs with dark, so appIsDark is true by the time this is read — but
    // the record wins either way, because the id is explicit.
    expect(resolveReaderTheme("blue", true, READER_THEMES_BY_ID)).toBe(READER_THEMES_BY_ID.blue);
  });

  it("follows the app for every plain appearance", () => {
    // Light, Dark and Default all fall through to the light/dark records, which
    // are derived from the app palette — so the Reader renders exactly as it did
    // before any of this existed.
    [constant.Default, constant.Light, constant.Dark].forEach((value) => {
      expect(resolveReaderTheme(value, false)).toBe(READER_THEMES_BY_ID.light);
      expect(resolveReaderTheme(value, true)).toBe(READER_THEMES_BY_ID.dark);
    });
  });

  it("falls back to the app appearance for an unknown id", () => {
    expect(resolveReaderTheme("khalsa-gold", false)).toBe(READER_THEMES_BY_ID.light);
    expect(resolveReaderTheme(undefined, true)).toBe(READER_THEMES_BY_ID.dark);
  });

  it("agrees with appearanceFor for every designed theme", () => {
    // The invariant that stops a dark-chromed app around a cream page: whatever
    // appearance a theme asks ThemeProvider for, the record it resolves to has
    // that same base.
    Object.values(READER_THEMES_BY_ID)
      .filter((t) => isDesignedTheme(t.id))
      .forEach((t) => {
        const appIsDark = appearanceFor(t.id) === "dark";
        expect(resolveReaderTheme(t.id, appIsDark).base).toBe(appearanceFor(t.id));
      });
  });
});
