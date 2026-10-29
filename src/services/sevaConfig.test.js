/* eslint-env jest */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSevaConfig, markSevaSeen, subscribeSevaDot, buildQgivUrl } from "./sevaConfig";

const mockLogError = jest.fn();
const mockLogMessage = jest.fn();

jest.mock("@common", () => {
  const { isNetworkFailure } = require("@common/networkFailure");
  return {
    constant: { SEVA_CONFIG_API_URL: "https://api.test/seva/config" },
    isNetworkFailure,
    logError: (...args) => mockLogError(...args),
    logMessage: (...args) => mockLogMessage(...args),
    logNetworkError: (message, error) =>
      isNetworkFailure(error) ? mockLogMessage(message) : mockLogError(message),
  };
});

// sevaConfig.js imports STRINGS directly from ../common/localization (not via
// @common), which otherwise pulls in the real react-native-localization
// module and crashes under jest without a native language interface.
jest.mock("../common/localization", () => ({
  SEVA_DESCRIPTION: "Test description",
  SEVA_FOOTER_TEXT: "Test footer",
  SEVA_TAX_DEDUCTIBLE: "Test tax message",
  SEVA_NON_US_TAX: "Test non-US tax message",
}));

const mockFetchOnce = (payload, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({ ok, json: async () => payload });
};

const RAW_CONTENT_WITH_WIDGET = "<h1>Headline</h1><!--SLOT:donate_widget--><p>Footer</p>";

describe("sevaConfig", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // The service's cache/seen-version keys are backed by the real community
    // AsyncStorage jest mock, which persists across `it()` blocks in the same
    // file unless cleared — see dashboardServices.test.js for the same lesson.
    await AsyncStorage.clear();
  });

  describe("getSevaConfig — online success path", () => {
    it("caches version + content under the new cache key and exposes parsed segments", async () => {
      mockFetchOnce({
        version: 7,
        country: "US",
        payment: {
          mode: "qgiv_prefill_open",
          baseUrl: "https://secure.qgiv.com/for/khalisfoundation",
        },
        redDot: 0,
        content: RAW_CONTENT_WITH_WIDGET,
      });

      const config = await getSevaConfig();

      expect(config.configVersion).toBe("7");
      expect(config.content.segments).toEqual([
        { type: "html", value: "<h1>Headline</h1>" },
        { type: "slot", name: "donate_widget" },
        { type: "html", value: "<p>Footer</p>" },
      ]);

      const cachedRaw = await AsyncStorage.getItem("@seva_config_dynamic_v2:en");
      const cached = JSON.parse(cachedRaw);
      expect(cached.version).toBe(7);
      expect(cached.content).toBe(RAW_CONTENT_WITH_WIDGET);
    });

    it("regression: country/payment flow through, and the badge is derived from the version", async () => {
      mockFetchOnce({
        version: 3,
        country: "CA",
        payment: { mode: "qgiv_prefill_open", baseUrl: "https://example.com/form" },
        redDot: 3,
        content: "",
      });

      const config = await getSevaConfig();

      expect(config.country).toBe("CA");
      expect(config.payment_mode).toBe("qgiv_prefill_open");
      // Never opened Seva → seen = 0 → badge is 3 − 0 = 3.
      expect(config.showSevaDot).toBe(true);
      expect(config.sevaDotCount).toBe(3);
    });

    it("empty backend content falls back to the bundled default content, not an empty page", async () => {
      mockFetchOnce({ version: 1, country: "US", payment: {}, redDot: 0, content: "" });
      const config = await getSevaConfig();
      expect(config.content.segments.length).toBeGreaterThan(0);
      expect(config.content.segments).toEqual(
        expect.arrayContaining([{ type: "slot", name: "donate_widget" }])
      );
    });

    it("passes the raw countryCode through for currency resolution", async () => {
      mockFetchOnce({
        version: 1,
        country: "OTHER",
        countryCode: "IN",
        payment: {},
        redDot: 0,
        content: "",
      });
      const config = await getSevaConfig();
      expect(config.countryCode).toBe("IN");
    });

    it("countryCode defaults to null when the backend omits it (old server, or genuinely unknown)", async () => {
      mockFetchOnce({ version: 1, country: "US", payment: {}, redDot: 0, content: "" });
      const config = await getSevaConfig();
      expect(config.countryCode).toBeNull();
    });
  });

  describe("getSevaConfig — offline / failure fallback", () => {
    it("returns the last cached content when the fetch fails and a cache exists", async () => {
      mockFetchOnce({
        version: 5,
        country: "US",
        payment: { mode: "qgiv_prefill_open" },
        redDot: 0,
        content: RAW_CONTENT_WITH_WIDGET,
      });
      await getSevaConfig(); // populates the cache

      global.fetch = jest.fn().mockRejectedValue(new Error("network down"));
      const config = await getSevaConfig();

      expect(config.configVersion).toBe("5");
      expect(config.content.segments).toEqual([
        { type: "html", value: "<h1>Headline</h1>" },
        { type: "slot", name: "donate_widget" },
        { type: "html", value: "<p>Footer</p>" },
      ]);
    });

    it("falls back to the bundled default content (not a bare empty page) with no cache and no network", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("network down"));
      const config = await getSevaConfig();
      expect(config.content.segments.length).toBeGreaterThan(0);
      expect(config.content.segments).toEqual(
        expect.arrayContaining([
          { type: "slot", name: "donate_widget" },
          { type: "slot", name: "tax_note" },
        ])
      );
    });

    it("real cached content still wins over the bundled default once it exists", async () => {
      mockFetchOnce({
        version: 2,
        country: "US",
        payment: {},
        redDot: 0,
        content: RAW_CONTENT_WITH_WIDGET,
      });
      await getSevaConfig(); // populates the cache with real, non-empty content

      global.fetch = jest.fn().mockRejectedValue(new Error("network down"));
      const config = await getSevaConfig();

      // Not the bundled default — the real cached content, verbatim.
      expect(config.content.segments).toEqual([
        { type: "html", value: "<h1>Headline</h1>" },
        { type: "slot", name: "donate_widget" },
        { type: "html", value: "<p>Footer</p>" },
      ]);
    });

    it("a returning offline user keeps the last-known countryCode from cache (currency stays consistent)", async () => {
      mockFetchOnce({
        version: 2,
        country: "OTHER",
        countryCode: "GB",
        payment: {},
        redDot: 0,
        content: "",
      });
      await getSevaConfig(); // populates the cache with countryCode "GB"

      global.fetch = jest.fn().mockRejectedValue(new Error("network down"));
      const config = await getSevaConfig();
      expect(config.countryCode).toBe("GB");
    });

    it("a brand-new offline user (nothing ever cached) gets countryCode null — falls back to device locale", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("network down"));
      const config = await getSevaConfig();
      expect(config.countryCode).toBeNull();
    });

    it("switching language offline does NOT replay the other language's cached content (regression)", async () => {
      // Cache English content online.
      mockFetchOnce({
        version: 1,
        country: "US",
        payment: {},
        redDot: 0,
        content: '<h1 class="seva-hero-title">Support our mission.</h1>',
      });
      await getSevaConfig("en");

      // Go offline and switch to Italian, which was never fetched. Must NOT
      // fall through to the English cache — that would show English text
      // under an Italian-selected UI. It should fall to the bundled Italian
      // default instead (never the wrong-language cache).
      global.fetch = jest.fn().mockRejectedValue(new Error("network down"));
      const config = await getSevaConfig("it");
      expect(config.source).toBe("fallback");
      expect(config.content.segments.some((s) => s.type === "html" && s.value.includes("Support our mission"))).toBe(false);
    });

    it("a returning offline user in a language that WAS cached still gets their real cached content", async () => {
      mockFetchOnce({
        version: 4,
        country: "US",
        payment: {},
        redDot: 0,
        content: RAW_CONTENT_WITH_WIDGET,
      });
      await getSevaConfig("it"); // populates the Italian-keyed cache

      global.fetch = jest.fn().mockRejectedValue(new Error("network down"));
      const config = await getSevaConfig("it");
      expect(config.source).toBe("cache");
      expect(config.content.segments).toEqual([
        { type: "html", value: "<h1>Headline</h1>" },
        { type: "slot", name: "donate_widget" },
        { type: "html", value: "<p>Footer</p>" },
      ]);
    });
  });

  describe("badge does not resurrect offline after the page was seen", () => {
    it("stays cleared on an offline reopen once the user has visited Seva", async () => {
      // Fetch v1 online: server says 1 version missed → dot shows.
      mockFetchOnce({ version: 1, country: "US", payment: {}, redDot: 1, content: "" });
      const first = await getSevaConfig();
      expect(first.sevaDotCount).toBe(1);

      // User opens Seva → acknowledges v1.
      await markSevaSeen();

      // Reopen with no network: served from cache. The cached response was
      // captured BEFORE the visit, so a stale cached redDot would wrongly
      // resurrect the dot here — it must be recomputed as 1 − 1 = 0.
      global.fetch = jest.fn().mockRejectedValue(new Error("network down"));
      const offline = await getSevaConfig();
      expect(offline.sevaDotCount).toBe(0);
      expect(offline.showSevaDot).toBe(false);
    });

    it("still shows the real missed count offline for versions published after the visit", async () => {
      mockFetchOnce({ version: 2, country: "US", payment: {}, redDot: 2, content: "" });
      await getSevaConfig();
      await markSevaSeen(); // acknowledges v2

      // A later fetch sees v5 (3 newer versions), then the user goes offline.
      mockFetchOnce({ version: 5, country: "US", payment: {}, redDot: 3, content: "" });
      await getSevaConfig();

      global.fetch = jest.fn().mockRejectedValue(new Error("network down"));
      const offline = await getSevaConfig();
      expect(offline.sevaDotCount).toBe(3); // 5 − 2, recomputed offline
    });

    it("does not persist the derived redDot into the cache", async () => {
      mockFetchOnce({ version: 1, country: "US", payment: {}, redDot: 1, content: "" });
      await getSevaConfig();

      const cached = JSON.parse(await AsyncStorage.getItem("@seva_config_dynamic_v2:en"));
      expect(cached).not.toHaveProperty("redDot");
      expect(cached.version).toBe(1); // the durable bits are still cached
    });

    it("re-derives the badge rather than replaying a stale-high server redDot", async () => {
      // Establish v2 as known, and acknowledge it.
      mockFetchOnce({ version: 2, country: "US", payment: {}, redDot: 0, content: "" });
      await getSevaConfig();
      await markSevaSeen(); // seen = 2

      // The server computes redDot from the `?v=` it was sent, at request time.
      // If the user acknowledges mid-round-trip, that value arrives stale-high
      // (here: 2) and would resurrect the dot they just cleared. The client
      // must re-derive it against the CURRENT seen version: 2 − 2 = 0.
      mockFetchOnce({ version: 2, country: "US", payment: {}, redDot: 2, content: "" });
      const config = await getSevaConfig();

      expect(config.sevaDotCount).toBe(0);
      expect(config.showSevaDot).toBe(false);
    });

    it("shows the guess dot on a fresh offline install, but not after Seva was opened", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("network down"));

      // Never fetched, never visited → advertise Seva with a plain dot.
      const beforeVisit = await getSevaConfig();
      expect(beforeVisit.sevaDotCount).toBe(1);

      // Visited (offline, so no version is known) → the guess must not return.
      await markSevaSeen();
      const afterVisit = await getSevaConfig();
      expect(afterVisit.sevaDotCount).toBe(0);
    });
  });

  describe("markSevaSeen / subscribeSevaDot", () => {
    it("emits 0 to subscribers when the version is marked seen", async () => {
      mockFetchOnce({ version: 4, country: "US", payment: {}, redDot: 4, content: "" });
      await getSevaConfig();

      const listener = jest.fn();
      const unsubscribe = subscribeSevaDot(listener);

      await markSevaSeen();

      expect(listener).toHaveBeenCalledWith(0);
      unsubscribe();
    });

    it("persists the seen version so the badge diff resets on the next fetch", async () => {
      mockFetchOnce({ version: 4, country: "US", payment: {}, redDot: 4, content: "" });
      await getSevaConfig();
      await markSevaSeen();

      mockFetchOnce({ version: 4, country: "US", payment: {}, redDot: 0, content: "" });
      const config = await getSevaConfig();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("?v=4"),
        expect.any(Object)
      );
      expect(config.sevaDotCount).toBe(0);
    });
  });

  describe("buildQgivUrl", () => {
    it("builds a one-time prefill URL with the amount, using the cached payment baseUrl", async () => {
      mockFetchOnce({
        version: 1,
        country: "US",
        payment: {
          mode: "qgiv_prefill_open",
          baseUrl: "https://secure.qgiv.com/for/khalisfoundation",
        },
        redDot: 0,
        content: "",
      });
      await getSevaConfig();

      const url = buildQgivUrl({ amount: 25, donationType: "one_time" });
      expect(url).toBe("https://secure.qgiv.com/for/khalisfoundation/amount/other/25.00/onetime");
    });

    it("builds a recurring monthly URL", async () => {
      mockFetchOnce({
        version: 1,
        country: "US",
        payment: {
          mode: "qgiv_prefill_open",
          baseUrl: "https://secure.qgiv.com/for/khalisfoundation",
        },
        redDot: 0,
        content: "",
      });
      await getSevaConfig();

      const url = buildQgivUrl({ amount: 10, donationType: "recurring", frequency: "Monthly" });
      expect(url).toBe(
        "https://secure.qgiv.com/for/khalisfoundation/amount/other/10.00/frequency/m"
      );
    });
  });
});
