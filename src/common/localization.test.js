/* eslint-env jest */
import fs from "fs";
import path from "path";

// react-native-localization can't be instantiated under jest (the other suites
// mock it away), so this reads the source and checks the language blocks
// directly. The point is parity: a user-visible string that exists in only some
// languages ships as English to everyone else.

const SUPPORTED = ["en-US", "hi", "pa", "fr", "it", "es"];

// Strings rendered by the dashboard month calendar and its month/year picker.
const CALENDAR_KEYS = [
  "NO_ACTIVITY",
  "NO_ACTIVITY_MONTH",
  "DAYS_THIS_MONTH",
  "DAY_THIS_MONTH",
  "LESS",
  "MORE",
  "MISSED",
];

const source = fs.readFileSync(path.join(__dirname, "localization.js"), "utf8");

const blockFor = (lang) => {
  const start = source.search(new RegExp(`\\n  "?${lang}"?: \\{`));
  if (start < 0) return null;
  const next = SUPPORTED[SUPPORTED.indexOf(lang) + 1];
  if (!next) return source.slice(start);
  const end = source.search(new RegExp(`\\n  "?${next}"?: \\{`));
  return end > start ? source.slice(start, end) : source.slice(start);
};

const valueOf = (block, key) => {
  const m = block.match(new RegExp(`\\n    ${key}:\\s*("(?:[^"\\\\]|\\\\.)*")`));
  return m ? JSON.parse(m[1]) : null;
};

/** Every key defined in a language block. */
const keysOf = (block) =>
  new Set([...block.matchAll(/\n {4}([A-Za-z_][A-Za-z0-9_]*):/g)].map((m) => m[1]));

describe("localization parity", () => {
  it("defines a block for every supported language", () => {
    SUPPORTED.forEach((lang) => {
      expect(blockFor(lang)).toBeTruthy();
    });
  });

  // The blanket check. A key present in English and missing elsewhere ships as
  // English to those users, which is the single most common way a translation
  // regresses — someone adds a string and updates one block. This covers all
  // 364 keys, so no hand-maintained key list can fall behind.
  describe.each(SUPPORTED.filter((l) => l !== "en-US"))("%s", (lang) => {
    it("defines every key that en-US defines", () => {
      const english = keysOf(blockFor("en-US"));
      const translated = keysOf(blockFor(lang));
      const missing = [...english].filter((key) => !translated.has(key));
      expect(missing).toEqual([]);
    });
  });

  describe.each(SUPPORTED)("%s", (lang) => {
    const block = blockFor(lang);

    it.each(CALENDAR_KEYS)("defines a non-empty %s", (key) => {
      const value = valueOf(block, key);
      expect(value).not.toBeNull();
      expect(value.trim().length).toBeGreaterThan(0);
    });
  });

  // The audio tab label (MUSIC). "Audios" is plural in English, and only the
  // languages that actually inflect the loanword follow it: French and Spanish
  // pluralise it ("des audios", "los audios"), while Italian treats foreign
  // nouns as invariable ("gli audio"), and Hindi/Punjabi leave the noun
  // unmarked and carry number on the verb instead — as the existing
  // WE_DO_NOT_HAVE_AUDIOS_FOR translations in this file already do.
  describe("audio tab label", () => {
    it.each(["en-US", "fr", "es"])("is pluralised in %s", (lang) => {
      expect(valueOf(blockFor(lang), "MUSIC")).toBe("Audios");
    });

    it("stays invariable in it", () => {
      expect(valueOf(blockFor("it"), "MUSIC")).toBe("Audio");
    });

    it.each(["hi", "pa"])("stays unmarked in %s", (lang) => {
      const value = valueOf(blockFor(lang), "MUSIC");
      expect(value).toBeTruthy();
      // Not the Latin-script form, and not carrying an English plural suffix.
      expect(value).not.toMatch(/s$/);
    });
  });

  it("does not leave a translation identical to the English placeholder", () => {
    // NO_ACTIVITY_MONTH is newly added; catch a copy-paste that skipped a language.
    const english = valueOf(blockFor("en-US"), "NO_ACTIVITY_MONTH");
    SUPPORTED.filter((l) => l !== "en-US").forEach((lang) => {
      expect(valueOf(blockFor(lang), "NO_ACTIVITY_MONTH")).not.toBe(english);
    });
  });
});

// ── The two gaps the parity checks above could not see ──────────────────────

describe("localization completeness", () => {
  // Every key a language defines must also exist in en-US.
  //
  // Parity was only checked in one direction, so a key could live in some
  // languages and not others without failing: `click_more_info` sat in fr, it
  // and es alone. Harmless there because nothing read it, but the same shape —
  // a key three languages have and three do not — is exactly how a string ends
  // up rendering as `undefined` for half the users.
  describe.each(SUPPORTED.filter((l) => l !== "en-US"))("%s", (lang) => {
    it("defines no key that en-US does not", () => {
      const english = keysOf(blockFor("en-US"));
      const extra = [...keysOf(blockFor(lang))].filter((key) => !english.has(key));
      expect(extra).toEqual([]);
    });
  });

  // Every STRINGS.<KEY> the app reads must actually exist.
  //
  // `STRINGS.SOMETHING_WENT_WRONG` was referenced by the donation web view and
  // defined in NO language. It was written as `STRINGS.SOMETHING_WENT_WRONG ||
  // "Something went wrong. Please try again."`, so it never crashed and never
  // looked broken in English — it just silently showed English to Punjabi,
  // Hindi, French, Italian and Spanish readers. Nothing else in the suite could
  // catch that, because the fallback made it look deliberate.
  it("defines every key the app actually reads", () => {
    const defined = keysOf(blockFor("en-US"));
    // Methods on the LocalizedStrings instance, not translation keys.
    const API = new Set([
      "formatString",
      "getLanguage",
      "setLanguage",
      "getInterfaceLanguage",
      "getString",
      "getAvailableLanguages",
    ]);

    const referenced = new Map();
    const walk = (dir) => {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules") walk(full);
          return;
        }
        if (!/\.(js|jsx)$/.test(entry.name)) return;
        if (/localization/.test(entry.name)) return;
        const text = fs.readFileSync(full, "utf8");
        [...text.matchAll(/STRINGS\.([A-Za-z_][A-Za-z0-9_]*)/g)].forEach((m) => {
          if (!API.has(m[1])) referenced.set(m[1], full);
        });
      });
    };
    walk(path.join(__dirname, ".."));

    const undefinedKeys = [...referenced.entries()]
      .filter(([key]) => !defined.has(key))
      .map(([key, file]) => `${key} (${path.basename(file)})`);

    expect(undefinedKeys).toEqual([]);
  });
});
