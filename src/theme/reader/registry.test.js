import { AA_CONTRAST, contrastRatio } from "./contrast";
import {
  bundledRegistry,
  mergeThemeRegistry,
  pickAllowed,
  remoteThemeName,
  sanitizeRemoteTheme,
} from "./registry";
import { READER_THEMES } from "./themes";

// A remote row is untrusted data until it is a record. These pin the gate —
// what gets in, what is dropped, and that nothing dropped can touch the
// bundled set — and the merge rules the picker and the Reader depend on.

const row = (overrides = {}) => ({
  id: "sapphire",
  position: 100,
  enabled: true,
  names: { en: "Sapphire", pa: "ਨੀਲਮ" },
  record: {
    base: "dark",
    palette: { ground: "#0A1A33", ink: "#E8F2FF", accent: "#7FC4FF" },
  },
  ...overrides,
});

describe("sanitizeRemoteTheme", () => {
  it("accepts the five-colour minimum", () => {
    const s = sanitizeRemoteTheme(row());
    expect(s).toMatchObject({ id: "sapphire", enabled: true });
    expect(s.record.palette.ground).toBe("#0A1A33");
  });

  it("rejects a bad id, a bad base and a non-hex colour", () => {
    const { palette } = row().record;
    expect(sanitizeRemoteTheme(row({ id: "Sapphire" }))).toBeNull();
    expect(sanitizeRemoteTheme(row({ record: { base: "sepia", palette } }))).toBeNull();
    const named = { ground: "navy", ink: "#fff", accent: "#0ff" };
    expect(sanitizeRemoteTheme(row({ record: { base: "dark", palette: named } }))).toBeNull();
  });

  it("requires an English name", () => {
    expect(sanitizeRemoteTheme(row({ names: { pa: "ਨੀਲਮ" } }))).toBeNull();
    expect(sanitizeRemoteTheme(row({ names: { "en-US": "Sapphire" } }))).not.toBeNull();
  });

  it("refuses an ink that cannot be read on its own ground", () => {
    const palette = { ground: "#222222", ink: "#333333", accent: "#0ff" };
    expect(contrastRatio(palette.ink, palette.ground)).toBeLessThan(AA_CONTRAST);
    expect(sanitizeRemoteTheme(row({ record: { base: "dark", palette } }))).toBeNull();
  });

  it("drops keys the schema does not know instead of throwing on them", () => {
    const record = { ...row().record, backgroundColour: "#000", border: { width: 1, wobble: 3 } };
    const s = sanitizeRemoteTheme(row({ record }));
    expect(s.record.backgroundColour).toBeUndefined();
    expect(s.record.border).toEqual({ width: 1 });
  });

  it("keeps only the id for a disabled row, whatever else it holds", () => {
    expect(sanitizeRemoteTheme(row({ enabled: false, record: "garbage", names: 7 }))).toEqual({
      id: "sapphire",
      position: 100,
      enabled: false,
      names: null,
      record: null,
    });
  });
});

describe("pickAllowed", () => {
  it("walks nested namespaces and ignores non-objects where an object is expected", () => {
    expect(pickAllowed({ typography: "big", palette: { ground: "#fff", nope: 1 } })).toEqual({
      palette: { ground: "#fff" },
    });
  });
});

describe("mergeThemeRegistry", () => {
  it("is exactly the bundled set with nothing remote", () => {
    const { list } = mergeThemeRegistry(null);
    expect(list.map((t) => t.id)).toEqual(READER_THEMES.map((t) => t.id));
    expect(bundledRegistry().list).toBe(READER_THEMES);
  });

  it("adds a valid remote theme, built like a bundled one, in order", () => {
    const { list, byId } = mergeThemeRegistry({ themes: [row({ position: 4 })] });
    const { sapphire } = byId;

    expect(sapphire.nameKey).toBe("reader_theme_sapphire");
    expect(sapphire.remote).toBe(true);
    expect(sapphire.names.pa).toBe("ਨੀਲਮ");
    // Derived like every designed theme: a full app palette exists.
    expect(sapphire.app.surface).toBeDefined();
    expect(sapphire.text.gurbani.color).toBeDefined();
    expect(Object.isFrozen(sapphire)).toBe(true);
    // Sorted by order among the bundled themes.
    const ids = list.map((t) => t.id);
    expect(ids.indexOf("sapphire")).toBeGreaterThan(ids.indexOf("blue"));
  });

  it("replaces a bundled theme when a row carries its id", () => {
    const palette = { ground: "#000033", ink: "#FFFFFF", accent: "#88CCFF" };
    const { byId } = mergeThemeRegistry({
      themes: [row({ id: "blue", names: { en: "Blue" }, record: { base: "dark", palette } })],
    });
    expect(byId.blue.palette.ground).toBe("#000033");
    expect(byId.blue.remote).toBe(true);
  });

  it("removes a theme with a disabled row, but never light or dark", () => {
    const { byId } = mergeThemeRegistry({
      themes: [row({ id: "kesari", enabled: false }), row({ id: "dark", enabled: false })],
    });
    expect(byId.kesari).toBeUndefined();
    expect(byId.dark).toBeDefined();
  });

  it("drops an invalid row without touching anything else", () => {
    const { list } = mergeThemeRegistry({
      themes: [row({ id: "broken", record: { base: "dark", palette: { ground: "#000" } } })],
    });
    expect(list.map((t) => t.id)).toEqual(READER_THEMES.map((t) => t.id));
  });
});

describe("remoteThemeName", () => {
  it("prefers the app language, then English, then the id", () => {
    const record = { id: "sapphire", names: { en: "Sapphire", pa: "ਨੀਲਮ" } };
    expect(remoteThemeName(record, "pa")).toBe("ਨੀਲਮ");
    expect(remoteThemeName(record, "fr")).toBe("Sapphire");
    expect(remoteThemeName({ id: "x", names: { "en-US": "Ex" } }, "DEFAULT")).toBe("Ex");
    expect(remoteThemeName({ id: "blue" }, "en")).toBeNull();
  });
});
