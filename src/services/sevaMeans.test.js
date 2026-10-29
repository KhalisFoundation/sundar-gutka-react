/* eslint-env jest */
import { getSevaMeansPage, prewarmSevaMeans, langToApi } from "./sevaMeans";

// In-memory AsyncStorage so cache reads/writes are observable and isolated.
const mockStore = new Map();
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((k) => Promise.resolve(mockStore.has(k) ? mockStore.get(k) : null)),
  setItem: jest.fn((k, v) => {
    mockStore.set(k, v);
    return Promise.resolve();
  }),
}));

const mockLogError = jest.fn();
const mockLogMessage = jest.fn();
jest.mock("@common", () => {
  const { isNetworkFailure } = require("@common/networkFailure");
  return {
    constant: { SEVA_MEANS_API_BASE: "https://api.test" },
    isNetworkFailure,
    logError: (...args) => mockLogError(...args),
    logMessage: (...args) => mockLogMessage(...args),
    logNetworkError: (message, error) =>
      isNetworkFailure(error) ? mockLogMessage(message) : mockLogError(message),
  };
});

const okJson = (body) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

beforeEach(() => {
  mockStore.clear();
  mockLogError.mockClear();
  global.fetch = jest.fn();
});

describe("langToApi", () => {
  it("normalises app language codes to supported API langs", () => {
    expect(langToApi("DEFAULT")).toBe("en");
    expect(langToApi("en-US")).toBe("en");
    expect(langToApi("pa")).toBe("pa");
    expect(langToApi("hi")).toBe("hi");
    expect(langToApi("zz")).toBe("en");
    expect(langToApi(undefined)).toBe("en");
  });
});

describe("getSevaMeansPage", () => {
  it("fetches, parses to segments, and caches on success", async () => {
    global.fetch.mockReturnValue(
      okJson({
        page: "seva-by-coding",
        lang: "en",
        title: "Seva for Coders",
        version: 1,
        content: '<p class="seva-intro">Love to code?</p>',
      })
    );

    const res = await getSevaMeansPage({ page: "coding", lang: "en-US" });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.test/seva-by-coding?lang=en",
      expect.any(Object)
    );
    expect(res.source).toBe("network");
    expect(res.title).toBe("Seva for Coders");
    expect(res.segments.length).toBeGreaterThan(0);
    expect(res.segments[0]).toEqual({ type: "html", value: expect.stringContaining("Love to code?") });
    // Cached for offline use.
    expect(mockStore.get("@seva_means_v1:seva-by-coding:en")).toContain("Love to code?");
  });

  it("falls back to the cached copy when the network fails", async () => {
    mockStore.set(
      "@seva_means_v1:seva-by-qa:pa",
      JSON.stringify({ content: "<p>ਕੈਸ਼</p>", title: "QA", version: 2, at: Date.now() })
    );
    global.fetch.mockRejectedValue(new Error("offline"));

    const res = await getSevaMeansPage({ page: "qa", lang: "pa" });
    expect(res.source).toBe("cache");
    expect(res.title).toBe("QA");
    expect(res.segments.length).toBeGreaterThan(0);
  });

  it("falls back to bundled default content when offline with nothing cached", async () => {
    global.fetch.mockRejectedValue(new Error("offline"));
    const res = await getSevaMeansPage({ page: "social", lang: "en" });
    expect(res.source).toBe("fallback");
    // Bundled default is a real, non-empty page (never blank).
    expect(res.segments.length).toBeGreaterThan(0);
    expect(mockLogError).toHaveBeenCalled();
  });

  it("treats an empty content body as a failure (not a blank page)", async () => {
    global.fetch.mockReturnValue(okJson({ content: "   " }));
    const res = await getSevaMeansPage({ page: "other", lang: "en" });
    expect(res.source).toBe("fallback");
    expect(res.segments.length).toBeGreaterThan(0);
  });
});

describe("prewarmSevaMeans", () => {
  it("fetches all four pages for the language", async () => {
    global.fetch.mockImplementation((url) =>
      okJson({ content: `<p>${url}</p>`, title: "t", version: 1 })
    );
    await prewarmSevaMeans({ lang: "hi" });
    expect(global.fetch).toHaveBeenCalledTimes(4);
    const urls = global.fetch.mock.calls.map((c) => c[0]);
    expect(urls).toEqual(
      expect.arrayContaining([
        "https://api.test/seva-by-social-media?lang=hi",
        "https://api.test/seva-by-coding?lang=hi",
        "https://api.test/seva-by-qa?lang=hi",
        "https://api.test/seva-by-other?lang=hi",
      ])
    );
  });

  it("never throws even if every fetch rejects", async () => {
    global.fetch.mockRejectedValue(new Error("offline"));
    await expect(prewarmSevaMeans({ lang: "en" })).resolves.toBeUndefined();
  });
});
