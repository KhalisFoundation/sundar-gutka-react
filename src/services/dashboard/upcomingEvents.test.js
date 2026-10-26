// The bundled list is the offline mirror of the backend's /dashboard/events
// feed, so these tests pin the dates users see when the network is gone — and
// the rollover arithmetic, which is where a "recurring month/day" list goes
// wrong. The canonical copy is gurpurabs.data.ts in khalis-users-api.

import { getNextEvent, getUpcomingEvents } from "./upcomingEvents";

// babel-jest hoists these above the import above, so the mocks are in place
// before upcomingEvents.js resolves its own dependencies.
jest.mock("@common", () => ({
  constant: { UPCOMING_EVENTS_API_URL: "" },
  logError: jest.fn(),
}));
jest.mock("./connectivity", () => ({
  isOnline: jest.fn().mockResolvedValue(true),
  OfflineError: class OfflineError extends Error {},
}));
jest.mock("./dailyCache", () => ({
  readFreshCache: jest.fn().mockResolvedValue(null),
  writeCache: jest.fn(),
}));

const at = (iso) => jest.setSystemTime(new Date(`${iso}T09:00:00`));

describe("upcomingEvents (bundled SGPC list)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the full list sorted by daysAway, none in the past", async () => {
    at("2026-08-14");
    const events = await getUpcomingEvents();

    expect(events).toHaveLength(44);
    const away = events.map((e) => e.daysAway);
    expect(away).toEqual([...away].sort((a, b) => a - b));
    expect(Math.min(...away)).toBeGreaterThanOrEqual(0);
  });

  // The dates the app had wrong before the SGPC sync — the old list mapped the
  // Nanakshahi day-of-month onto the Gregorian month, running ~15 days early.
  it.each([
    ["First Prakash Sri Guru Granth Sahib Ji", "2026-09-12"],
    ["Joti Jot Guru Nanak Dev Ji", "2026-10-05"],
    ["Prakash Guru Ram Das Ji", "2026-10-27"],
    ["Prakash Guru Nanak Dev Ji", "2026-11-24"],
    ["Bandi Chhor Divas", "2026-11-08"],
    ["Shaheedi Guru Tegh Bahadur Sahib Ji", "2026-12-14"],
  ])("puts %s on %s", async (name, iso) => {
    at("2026-08-14");
    const events = await getUpcomingEvents();

    const hit = events.find((e) => e.name === name);
    expect(hit).toBeDefined();
    const expected = Math.round(
      (new Date(`${iso}T00:00:00`) - new Date("2026-08-14T00:00:00")) / 86400000
    );
    expect(hit.daysAway).toBe(expected);
  });

  it("carries the Nanakshahi date as the subtitle", async () => {
    at("2026-08-14");
    const events = await getUpcomingEvents();

    expect(events.find((e) => e.name === "First Prakash Sri Guru Granth Sahib Ji").subtitle).toBe(
      "27 Bhadon"
    );
  });

  it("treats an event happening today as 0 days away", async () => {
    at("2026-09-12");
    const events = await getUpcomingEvents();

    expect(events.find((e) => e.name === "First Prakash Sri Guru Granth Sahib Ji").daysAway).toBe(
      0
    );
  });

  it("rolls a passed event over to next year rather than dropping it", async () => {
    at("2026-09-13");
    const events = await getUpcomingEvents();

    expect(events.find((e) => e.name === "First Prakash Sri Guru Granth Sahib Ji").daysAway).toBe(
      364
    );
  });

  it("excludes non-Guru births, non-Guru martyrdoms and political events", async () => {
    at("2026-08-14");
    const names = (await getUpcomingEvents()).map((e) => e.name).join(" | ");

    expect(names).not.toMatch(/1984|Bhindranwale|Beant Singh|Akal Takht M/i);
    expect(names).not.toMatch(/Bhagat Singh|Udham Singh|Sahibzada/i);
    expect(names).not.toMatch(/Ghallughara|Saka Nankana|Morcha/i);
  });

  it("getNextEvent returns the nearest one", async () => {
    at("2026-08-14");
    const next = await getNextEvent();

    expect(next.name).toBe("Sampuranta Divas Sri Guru Granth Sahib Ji");
    expect(next.daysAway).toBe(16);
  });
});
