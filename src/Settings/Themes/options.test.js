/* eslint-env jest */
import { remoteThemeRows } from "@theme/reader/__fixtures__/remoteThemes";
import { mergeThemeRegistry } from "@theme/reader/registry";
import { themeLabel, themeOptions } from "./options";

// Who gets to name a theme.
//
// The backend defines a remote theme, so it defines what that theme is called
// and in which languages. The localisation file cannot know about a theme
// added after the release — and, worse, it may still hold a leftover string
// for a theme that USED to be bundled, which is exactly what silently
// overrode the names column.

const STRINGS = {
  default: "System default",
  light: "Light",
  dark: "Dark",
  // The kind of leftover that caused the bug: a theme that has since moved to
  // the backend, still named in app code.
  reader_theme_puratan: "STALE APP STRING",
};

const registry = mergeThemeRegistry({ themes: remoteThemeRows });
const options = themeOptions(registry);
const option = (value) => options.find((o) => o.value === value);

describe("what a tile is called", () => {
  it("names a remote theme from the backend, not from a leftover app string", () => {
    expect(themeLabel(option("puratan"), "en-US", STRINGS)).not.toBe("STALE APP STRING");
    expect(themeLabel(option("puratan"), "en-US", STRINGS)).toBe("Puratan");
  });

  it("names a remote theme in each of the six languages the app ships", () => {
    const row = remoteThemeRows.find((r) => r.id === "puratan");
    ["en-US", "hi", "pa", "fr", "it", "es"].forEach((lang) => {
      expect(themeLabel(option("puratan"), lang, STRINGS)).toBe(row.names[lang]);
    });
  });

  it("falls back to English for a language the row does not carry", () => {
    const partial = { record: { names: { "en-US": "Only English" } }, labelKey: "x", value: "x" };
    expect(themeLabel(partial, "it", STRINGS)).toBe("Only English");
  });

  it("names the bundled appearances from the localisation file", () => {
    // They carry no `names` of their own, so nothing shadows the file.
    expect(themeLabel(option("Default"), "en-US", STRINGS)).toBe("System default");
    expect(themeLabel(option("Light"), "en-US", STRINGS)).toBe("Light");
    expect(themeLabel(option("Dark"), "en-US", STRINGS)).toBe("Dark");
  });

  it("falls back to the raw value when nothing can name it", () => {
    // A theme withdrawn since it was chosen: a row, not an empty label.
    expect(themeLabel({ value: "gone", labelKey: "reader_theme_gone" }, "en-US", STRINGS)).toBe(
      "gone"
    );
  });
});
