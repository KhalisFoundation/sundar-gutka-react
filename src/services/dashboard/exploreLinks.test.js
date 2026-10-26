/* eslint-env jest */
import { CACHE_TTL_MS, getExploreLinks, langToApi, sanitizeLink } from "./exploreLinks";

// Network → cache → bundled, and that nothing the server sends can put a tile
// on screen this build cannot open.

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
    constant: { EXPLORE_LINKS_API_URL: "https://api.test/explore-links" },
    isNetworkFailure,
    logError: (...args) => mockLogError(...args),
    logMessage: (...args) => mockLogMessage(...args),
    logNetworkError: (message, error) =>
      isNetworkFailure(error) ? mockLogMessage(message) : mockLogError(message),
  };
});

jest.mock("@common/localization", () => ({
  TILE_SEARCH_SHABAD: "Search SikhiToTheMax",
  TILE_HUKAMNAMA: "Hukamnama",
  TILE_ASK_AI: "Ask Khalis AI",
  TILE_GURBANI_QA: "Gurbani Q&A",
  BADGE_NEW: "NEW",
  TILE_LEARN_WORD: "Learn Gurmukhi Words",
  TILE_EXPLORE_GURDHAM: "Explore Gurdwaras",
}));

const okJson = (body) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

const serverLinks = [
  {
    id: "gurdham",
    position: 1,
    title: "ਗੁਰਦੁਆਰੇ ਖੋਜੋ",
    subtitle: "Gurdham",
    badge: null,
    url: "https://gurdham.com",
    androidPkg: "com.khalis.gurdham",
    iosScheme: null,
    iosAppId: null,
    icon: "gurdham",
    plate: null,
  },
];

beforeEach(() => {
  mockStore.clear();
  mockLogError.mockClear();
  mockLogMessage.mockClear();
  global.fetch = jest.fn();
});

describe("langToApi", () => {
  it("normalises the app language to an API tag", () => {
    expect(langToApi("DEFAULT")).toBe("en");
    expect(langToApi("en-US")).toBe("en");
    expect(langToApi("pa")).toBe("pa");
    expect(langToApi("zz")).toBe("en");
  });
});

describe("sanitizeLink", () => {
  it("drops a tile with no https url, and one with no id", () => {
    expect(sanitizeLink({ id: "x", url: "http://plain.example" })).toBeNull();
    expect(sanitizeLink({ url: "https://ok.example" })).toBeNull();
  });

  it("keeps only the fields this build renders, with safe defaults", () => {
    expect(sanitizeLink({ id: "x", url: "https://ok.example", plate: "neon", extra: 1 })).toEqual({
      id: "x",
      position: 0,
      title: "x",
      subtitle: "",
      badge: null,
      url: "https://ok.example",
      androidPkg: null,
      appLink: null,
      iosAppId: null,
      icon: null,
      plate: null,
    });
  });
});

describe("getExploreLinks", () => {
  it("fetches in the app language, caches, and reports network", async () => {
    global.fetch.mockReturnValue(okJson({ lang: "pa", version: 42, links: serverLinks }));

    const res = await getExploreLinks({ lang: "pa" });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.test/explore-links?lang=pa",
      expect.any(Object)
    );
    expect(res.source).toBe("network");
    expect(res.version).toBe(42);
    expect(res.links[0].title).toBe("ਗੁਰਦੁਆਰੇ ਖੋਜੋ");
    expect(mockStore.get("@explore_links_v1:pa")).toContain("gurdham");
  });

  it("serves the cache for that language when the network fails", async () => {
    mockStore.set("@explore_links_v1:hi", JSON.stringify({ version: 7, links: serverLinks }));
    global.fetch.mockRejectedValue(new TypeError("Network request failed"));

    const res = await getExploreLinks({ lang: "hi" });

    expect(res.source).toBe("cache");
    expect(res.version).toBe(7);
    // The cache saving the day is not a fault worth a report.
    expect(mockLogError).not.toHaveBeenCalled();
  });

  it("falls to the bundled list on a fresh offline install, in the current language", async () => {
    global.fetch.mockRejectedValue(new TypeError("Network request failed"));

    const res = await getExploreLinks({ lang: "en" });

    expect(res.source).toBe("bundled");
    expect(res.links.map((l) => l.id)).toEqual([
      "search",
      "hukamnama",
      "khalis-ai",
      "sehaj-path",
      "shabadavali",
      "gurdham",
    ]);
    expect(res.links.find((l) => l.id === "gurdham").androidPkg).toBe("com.khalis.gurdham");
    expect(res.links.find((l) => l.id === "khalis-ai").badge).toBe("NEW");
    // A connection failure is a breadcrumb, not a crash report.
    expect(mockLogMessage).toHaveBeenCalled();
    expect(mockLogError).not.toHaveBeenCalled();
  });

  it("treats an empty or unrenderable server list as a failure rather than blanking the row", async () => {
    global.fetch.mockReturnValue(okJson({ links: [{ id: "bad", url: "ftp://x" }] }));

    const res = await getExploreLinks({ lang: "en" });

    expect(res.source).toBe("bundled");
  });

  it("does not let a poisoned cache through", async () => {
    mockStore.set("@explore_links_v1:en", "{not json");
    global.fetch.mockRejectedValue(new Error("HTTP 500"));

    const res = await getExploreLinks({ lang: "en" });

    expect(res.source).toBe("bundled");
  });
});

describe("the TTL — the Dashboard opens many times a day", () => {
  const cacheFor = (lang, at) =>
    mockStore.set(
      `@explore_links_v1:${lang}`,
      JSON.stringify({ version: 7, at, links: serverLinks })
    );

  it("answers from the cache inside the window, without asking", async () => {
    // The API caches its own rows for the same five minutes, so a request here
    // could not return anything the cache does not already hold.
    cacheFor("en", Date.now() - 60 * 1000);

    const res = await getExploreLinks({ lang: "en" });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(res.source).toBe("cache");
    expect(res.version).toBe(7);
  });

  it("asks again once the window has passed", async () => {
    cacheFor("en", Date.now() - CACHE_TTL_MS - 1);
    global.fetch.mockReturnValue(okJson({ version: 9, links: serverLinks }));

    const res = await getExploreLinks({ lang: "en" });

    expect(global.fetch).toHaveBeenCalled();
    expect(res.source).toBe("network");
    expect(res.version).toBe(9);
  });

  it("force ignores the window, for a caller that knows better", async () => {
    cacheFor("en", Date.now());
    global.fetch.mockReturnValue(okJson({ version: 9, links: serverLinks }));

    await getExploreLinks({ lang: "en", force: true });

    expect(global.fetch).toHaveBeenCalled();
  });

  it("keeps a stale cache when the ask fails, rather than falling to bundled", async () => {
    // Offline, a captive portal and a backend that is down look the same from
    // here. None of them may replace tiles the user has already seen with the
    // list this build happened to ship.
    cacheFor("en", Date.now() - CACHE_TTL_MS - 1);
    global.fetch.mockRejectedValue(new Error("offline"));

    const res = await getExploreLinks({ lang: "en" });

    expect(res.source).toBe("cache");
    expect(res.version).toBe(7);
  });

  it("treats a cache with no timestamp as stale", async () => {
    // Written by a build before the TTL existed.
    mockStore.set("@explore_links_v1:en", JSON.stringify({ version: 7, links: serverLinks }));
    global.fetch.mockReturnValue(okJson({ version: 9, links: serverLinks }));

    const res = await getExploreLinks({ lang: "en" });

    expect(res.source).toBe("network");
  });

  it("keeps each language on its own clock", async () => {
    cacheFor("en", Date.now());
    global.fetch.mockReturnValue(okJson({ version: 9, links: serverLinks }));

    await getExploreLinks({ lang: "en" });
    expect(global.fetch).not.toHaveBeenCalled();

    await getExploreLinks({ lang: "pa" });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
