import { NativeModules, Platform } from "react-native";
import { resolveDeviceCountry, resolveCurrency } from "./currency";

/**
 * Covers the on-device country ladder: timezone -> UTC offset -> device region.
 *
 * The case that matters most is an Indian donor whose phone language is
 * English (US) or English (UK) — the common setup. Device region reports US/GB
 * there, so region alone shows $ or £. The timezone tiers must win.
 */

const setTimeZone = (tz) => {
  jest.spyOn(Intl, "DateTimeFormat").mockImplementation(() => ({
    resolvedOptions: () => ({ timeZone: tz }),
  }));
};

/** Fakes the engine having no timezone data at all (Hermes without ICU). */
const setNoTimeZone = () => setTimeZone("UTC");

/** getTimezoneOffset() is minutes to ADD to local time to reach UTC. */
const setOffsetMinutes = (mins) => {
  jest.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(mins);
};

/** Device language/region, e.g. "en_US" for an Indian user on US English. */
const setDeviceLocale = (locale) => {
  Platform.OS = "android";
  NativeModules.I18nManager = { localeIdentifier: locale };
};

beforeEach(() => {
  setOffsetMinutes(0); // neutral unless a test sets it
  setDeviceLocale("en_US");
});

afterEach(() => jest.restoreAllMocks());

describe("tier 1 — IANA timezone wins, regardless of device language", () => {
  it("Indian phone set to English (US) still resolves IN -> INR", () => {
    setTimeZone("Asia/Kolkata");
    setDeviceLocale("en_US"); // the exact real-world setup that was broken
    expect(resolveDeviceCountry()).toBe("IN");
    expect(resolveCurrency().code).toBe("INR");
    expect(resolveCurrency().symbol).toBe("₹");
  });

  it("Indian phone set to English (UK) still resolves IN -> INR", () => {
    setTimeZone("Asia/Kolkata");
    setDeviceLocale("en_GB");
    expect(resolveCurrency().code).toBe("INR");
  });

  it("accepts the legacy Asia/Calcutta alias", () => {
    setTimeZone("Asia/Calcutta");
    expect(resolveDeviceCountry()).toBe("IN");
  });

  it.each([
    ["Europe/London", "GB", "GBP"],
    ["America/Toronto", "CA", "CAD"],
    ["America/Vancouver", "CA", "CAD"],
    ["Australia/Sydney", "AU", "AUD"],
    ["Australia/Perth", "AU", "AUD"],
    ["Europe/Berlin", "DE", "EUR"],
    ["Europe/Dublin", "IE", "EUR"],
    ["Europe/Madrid", "ES", "EUR"],
  ])("%s -> %s -> %s", (tz, country, currency) => {
    setTimeZone(tz);
    expect(resolveDeviceCountry()).toBe(country);
    expect(resolveCurrency().code).toBe(currency);
  });

  it("an unmapped timezone falls through to USD", () => {
    setTimeZone("America/New_York");
    expect(resolveCurrency().code).toBe("USD");
  });
});

describe("tier 2 — UTC offset, when the engine has no timezone data", () => {
  it("UTC+5:30 resolves IN even with no timezone and a US locale", () => {
    setNoTimeZone();
    setOffsetMinutes(-330);
    setDeviceLocale("en_US");
    expect(resolveDeviceCountry()).toBe("IN");
    expect(resolveCurrency().code).toBe("INR");
  });

  it("does not guess from ambiguous offsets", () => {
    setNoTimeZone();
    setOffsetMinutes(-600); // UTC+10: AU, but also PNG / Vladivostok
    setDeviceLocale("en_US");
    expect(resolveCurrency().code).toBe("USD");
  });
});

describe("tier 3 — device region, last resort only", () => {
  it("is used when neither timezone nor offset resolves", () => {
    setNoTimeZone();
    setOffsetMinutes(0);
    setDeviceLocale("en_GB");
    expect(resolveDeviceCountry()).toBe("GB");
    expect(resolveCurrency().code).toBe("GBP");
  });

  it("never overrides the timezone (the whole point of the ordering)", () => {
    setTimeZone("Asia/Kolkata");
    setDeviceLocale("en_US");
    expect(resolveCurrency().code).not.toBe("USD");
    expect(resolveCurrency().code).toBe("INR");
  });
});

describe("safety", () => {
  it("survives Intl throwing entirely", () => {
    jest.spyOn(Intl, "DateTimeFormat").mockImplementation(() => {
      throw new Error("no Intl in this engine");
    });
    setOffsetMinutes(-330);
    expect(resolveCurrency().code).toBe("INR");
  });

  it("an explicit override still beats every device signal", () => {
    setTimeZone("Asia/Kolkata");
    expect(resolveCurrency("GB").code).toBe("GBP");
  });

  it("always returns a usable currency object", () => {
    setNoTimeZone();
    setOffsetMinutes(0);
    setDeviceLocale("");
    const c = resolveCurrency();
    expect(c.code).toBe("USD");
    expect(typeof c.symbol).toBe("string");
    expect(typeof c.rate).toBe("number");
  });
});
