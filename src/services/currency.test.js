/* eslint-env jest */
// getLiveRate is the only outside coupling — mock it so we can drive both the
// "no live rate yet → static fallback" and "live rate present" paths.
jest.mock("./exchangeRates", () => ({
  getLiveRate: jest.fn(() => null),
}));

import { getLiveRate } from "./exchangeRates";
import {
  countryToCurrencyCode,
  resolveCurrency,
  usdToLocal,
  localToUsd,
  niceRoundLocal,
  formatCurrency,
  formatNumber,
  localPresets,
  minLocalAmount,
  resolveLocalPresets,
  CURRENCIES,
} from "./currency";

describe("currency", () => {
  beforeEach(() => getLiveRate.mockReturnValue(null)); // default: fall back to static rates

  describe("countryToCurrencyCode", () => {
    it("maps the six supported regions", () => {
      expect(countryToCurrencyCode("IN")).toBe("INR");
      expect(countryToCurrencyCode("US")).toBe("USD");
      expect(countryToCurrencyCode("CA")).toBe("CAD");
      expect(countryToCurrencyCode("AU")).toBe("AUD");
      expect(countryToCurrencyCode("GB")).toBe("GBP");
      expect(countryToCurrencyCode("UK")).toBe("GBP");
    });

    it("maps eurozone members to EUR", () => {
      ["FR", "DE", "ES", "IT", "NL", "IE"].forEach((c) =>
        expect(countryToCurrencyCode(c)).toBe("EUR")
      );
    });

    it("defaults the rest of the world (and junk) to USD", () => {
      expect(countryToCurrencyCode("JP")).toBe("USD");
      expect(countryToCurrencyCode("")).toBe("USD");
      expect(countryToCurrencyCode(undefined)).toBe("USD");
      expect(countryToCurrencyCode("zz")).toBe("USD");
    });

    it("is case-insensitive", () => {
      expect(countryToCurrencyCode("in")).toBe("INR");
    });
  });

  describe("minLocalAmount", () => {
    // Qgiv charges whole US dollars and localToUsd floors at $1, so anything
    // below a dollar was handed over AS a dollar — ₹1 arrived as ~₹96.
    it("is a clean round figure in every supported currency", () => {
      expect(minLocalAmount("USD")).toBe(1);
      expect(minLocalAmount("GBP")).toBe(1); // £0.75/$ → £1
      expect(minLocalAmount("EUR")).toBe(1); // €0.88/$ → €1
      expect(minLocalAmount("CAD")).toBe(2); // CA$1.41/$ → CA$2
      expect(minLocalAmount("AUD")).toBe(2); // A$1.43/$ → A$2
      expect(minLocalAmount("INR")).toBe(100); // ₹96/$ → ₹100
    });

    it("is never worth less than a dollar, in any currency", () => {
      Object.keys(CURRENCIES).forEach((code) => {
        expect(localToUsd(minLocalAmount(code), code)).toBeGreaterThanOrEqual(1);
      });
    });

    it("follows the live rate rather than the static fallback", () => {
      getLiveRate.mockReturnValue(110); // rupee weakens
      expect(minLocalAmount("INR")).toBe(110);
    });

    it("rejects exactly the figures that would overcharge the donor", () => {
      // ₹1 and ₹50 both convert to the $1 Qgiv floor — roughly ₹96 either way.
      expect(1).toBeLessThan(minLocalAmount("INR"));
      expect(50).toBeLessThan(minLocalAmount("INR"));
      expect(100).toBeGreaterThanOrEqual(minLocalAmount("INR"));
    });
  });

  describe("niceRoundLocal", () => {
    it("snaps converted figures to clean donation numbers", () => {
      expect(niceRoundLocal(14.09)).toBe(15); // CA$ $10 tier → CA$15, not CA$14
      expect(niceRoundLocal(8.79)).toBe(10); // € $10 tier
      expect(niceRoundLocal(70.4)).toBe(70);
      expect(niceRoundLocal(140.9)).toBe(140);
    });

    it("never collapses a positive amount to zero", () => {
      expect(niceRoundLocal(1)).toBe(5);
      expect(niceRoundLocal(0)).toBe(0);
      expect(niceRoundLocal(-3)).toBe(0);
    });
  });

  describe("figure conversion (static fallback when no live rate)", () => {
    it("converts USD to a real local figure at the fallback rate", () => {
      const cad = { code: "CAD", ...CURRENCIES.CAD };
      expect(usdToLocal(10, cad)).toBe(14); // 10 × 1.41
    });

    it("nice-rounds the derived local preset cards", () => {
      const cad = { code: "CAD", ...CURRENCIES.CAD };
      // $10/$50/$100 → real CAD → clean cards.
      expect(localPresets([10, 50, 100], cad)).toEqual([15, 70, 140]);
    });

    it("keeps INR's fixed round ladder and converts each tier to whole USD", () => {
      const inr = { code: "INR", ...CURRENCIES.INR };
      expect(resolveLocalPresets(inr)).toEqual([100, 1000, 5000]);
      expect(localToUsd(100, inr)).toBe(1); // ₹100 → $1
      expect(localToUsd(1000, inr)).toBe(10); // ₹1000 → $10
      expect(localToUsd(5000, inr)).toBe(52); // ₹5000 → $52 (5000/96)
    });

    it("rounds the Qgiv USD to whole dollars, flooring at $1", () => {
      const cad = { code: "CAD", ...CURRENCIES.CAD };
      expect(localToUsd(15, cad)).toBe(11); // CA$15 → 10.64 → $11
      expect(localToUsd(0, cad)).toBe(0);
      expect(localToUsd(1, cad)).toBe(1); // 1/1.41 = 0.71 → floored to $1
    });

    it("accepts a currency code string as well as an object", () => {
      expect(localToUsd(1000, "INR")).toBe(10);
    });
  });

  describe("figure conversion (live rate overrides fallback)", () => {
    it("uses the live ECB rate for both display and the Qgiv charge", () => {
      getLiveRate.mockImplementation((code) => (code === "INR" ? 96.56 : null));
      const inr = { code: "INR", ...CURRENCIES.INR };
      expect(usdToLocal(10, inr)).toBe(966); // 10 × 96.56
      expect(localToUsd(1000, inr)).toBe(10); // 1000 / 96.56 = 10.36 → $10
    });
  });

  describe("formatting", () => {
    it("groups thousands without a symbol", () => {
      expect(formatNumber(1000)).toBe("1,000");
      expect(formatNumber(10000)).toBe("10,000");
      expect(formatNumber(10)).toBe("10");
    });

    it("prefixes the currency symbol", () => {
      expect(formatCurrency(1000, "INR")).toBe("₹1,000");
      expect(formatCurrency(10, "USD")).toBe("$10");
      expect(formatCurrency(15, "CAD")).toBe("CA$15");
    });
  });

  describe("resolveCurrency", () => {
    it("honours an explicit country override", () => {
      expect(resolveCurrency("IN")).toEqual({
        code: "INR",
        symbol: "₹",
        rate: 96,
        presets: [100, 1000, 5000],
      });
      expect(resolveCurrency("DE").code).toBe("EUR");
    });

    it("returns a well-formed currency object with no override (device locale)", () => {
      const c = resolveCurrency();
      expect(typeof c.symbol).toBe("string");
      expect(typeof c.rate).toBe("number");
      expect(CURRENCIES[c.code]).toBeDefined();
    });
  });
});
