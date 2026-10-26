import { isConfigured, resolveBaseUrl, SCORING_URL_PLACEHOLDER } from "./config";

describe("scoring config", () => {
  it("falls back to the placeholder and reports not configured when the URL is empty", () => {
    expect(resolveBaseUrl(undefined)).toBe(SCORING_URL_PLACEHOLDER);
    expect(resolveBaseUrl("")).toBe(SCORING_URL_PLACEHOLDER);
    expect(isConfigured(resolveBaseUrl(undefined))).toBe(false);
  });

  it("trims trailing slashes from a real URL", () => {
    const url = resolveBaseUrl("https://score.example//");
    expect(url).toBe("https://score.example");
    expect(isConfigured(url)).toBe(true);
  });
});
