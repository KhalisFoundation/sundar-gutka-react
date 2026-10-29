/* eslint-env jest */
import { isCustomTitle, reminderBaniName, reminderTitle } from "./title";

jest.mock("@common/localization", () => ({
  __esModule: true,
  default: {
    time_for: "Time for",
    getString: (key, lang) =>
      ({
        "en-US": "Time for",
        hi: "समां है",
        pa: "ਸਮਾਂ ਹੈ",
        fr: "Il est temps de",
        it: "È l'ora di",
        es: "Es ora de",
      }[lang]),
  },
}));

// A reminder's name is drawn by the SYSTEM, in the shade and on the lock
// screen, where none of the app's Gurbani faces exist. That is the whole
// reason these rules are not "use section.gurmukhi".

const JAPJI = {
  gurmukhi: "jpujI swihb",
  gurmukhiUni: "ਜਪੁਜੀ ਸਾਹਿਬ",
  translit: "japujee saahib",
};

describe("reminderBaniName", () => {
  it("gives Unicode Gurmukhi when transliteration is off", () => {
    // NOT "jpujI swihb". That is the legacy ASCII encoding, which reads as
    // Latin nonsense anywhere the Gurbani font is not loaded.
    expect(reminderBaniName(JAPJI, false)).toBe("ਜਪੁਜੀ ਸਾਹਿਬ");
  });

  it("gives the transliteration when the user has asked for it", () => {
    // Transliteration wins, the same order useBaniTitle uses for in-app text:
    // it is an explicit choice about the script the user reads in.
    expect(reminderBaniName(JAPJI, true)).toBe("japujee saahib");
  });

  it("converts the legacy encoding when no Unicode name was stored", () => {
    // Reminders saved by older builds carry only the ASCII form.
    expect(reminderBaniName({ gurmukhi: "gur mMqR", translit: "gur ma(n)tr" }, false)).toBe(
      "ਗੁਰ ਮੰਤ੍ਰ"
    );
  });

  it("falls back to the transliteration rather than saying nothing", () => {
    expect(reminderBaniName({ translit: "japujee saahib" }, false)).toBe("japujee saahib");
    expect(reminderBaniName(null, false)).toBe("");
  });
});

describe("reminderTitle", () => {
  it("builds the stock title from the localised prefix and the Gurmukhi name", () => {
    expect(reminderTitle({ ...JAPJI, title: "Time for japujee saahib" }, false)).toBe(
      "Time for ਜਪੁਜੀ ਸਾਹਿਬ"
    );
  });

  it("follows the setting rather than the string it was stored with", () => {
    // The reported bug: a title baked at creation said "gur ma(n)tr" forever,
    // whatever the user later chose. Resolving now is what fixes that.
    const stored = { ...JAPJI, title: "Time for japujee saahib" };

    expect(reminderTitle(stored, false)).toBe("Time for ਜਪੁਜੀ ਸਾਹਿਬ");
    expect(reminderTitle(stored, true)).toBe("Time for japujee saahib");
  });

  it("leaves a title the user typed exactly as they typed it", () => {
    const renamed = { ...JAPJI, title: "Morning paath", titleCustom: true };

    expect(reminderTitle(renamed, false)).toBe("Morning paath");
    expect(reminderTitle(renamed, true)).toBe("Morning paath");
  });

  it("takes the prefix it is given, so each language keeps its own", () => {
    expect(reminderTitle({ ...JAPJI, title: "ਸਮਾਂ ਹੈ x" }, false, "ਸਮਾਂ ਹੈ")).toBe(
      "ਸਮਾਂ ਹੈ ਜਪੁਜੀ ਸਾਹਿਬ"
    );
  });
});

describe("isCustomTitle", () => {
  it("trusts the flag a rename sets", () => {
    expect(isCustomTitle({ title: "Time for japji", titleCustom: true })).toBe(true);
  });

  it("reads a stock title in any of the six languages as untouched", () => {
    // Prefix only, so switching language or transliteration cannot make an
    // untouched title look renamed.
    ["Time for", "समां है", "ਸਮਾਂ ਹੈ", "Il est temps de", "È l'ora di", "Es ora de"].forEach(
      (prefix) => {
        expect(isCustomTitle({ title: `${prefix} japji` })).toBe(false);
      }
    );
  });

  it("treats anything else as the user's own words", () => {
    expect(isCustomTitle({ title: "Morning paath" })).toBe(true);
  });

  it("says no when there is no title at all", () => {
    expect(isCustomTitle({})).toBe(false);
    expect(isCustomTitle(null)).toBe(false);
  });
});
