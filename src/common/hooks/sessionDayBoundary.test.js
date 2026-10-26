/* eslint-env jest */
import { act, renderHook } from "@testing-library/react-native";
import useListeningSession from "./useListeningSession";
import useReadingSession from "./useReadingSession";

const mockUpsertDailyActivity = jest.fn();
const mockInsertReadSession = jest.fn();
const mockInsertAudioSession = jest.fn();
let mockNavigation;

jest.mock("@common", () => ({
  logError: jest.fn(),
  logMessage: jest.fn(),
  trackBaniCompleted: jest.fn(() => Promise.resolve()),
  trackAudioStarted: jest.fn(() => Promise.resolve()),
  trackAudioCompleted: jest.fn(() => Promise.resolve()),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
}));

jest.mock("../../database/analytics", () => ({
  insertReadSession: (...a) => mockInsertReadSession(...a),
  insertAudioSession: (...a) => mockInsertAudioSession(...a),
  upsertDailyActivity: (...a) => mockUpsertDailyActivity(...a),
  incrementBaniReadCount: jest.fn(() => Promise.resolve()),
  // The real one invokes fn() immediately rather than queuing it.
  enqueueAnalyticsWrite: (fn) => fn(),
}));

jest.mock("../../services/dashboard/syncSignal", () => ({
  requestPush: jest.fn(),
}));

// TZ is pinned to UTC by jest.config.js, so local time is UTC here.
const AT_2350 = new Date("2026-08-20T23:50:00Z").getTime();
const AT_0006 = new Date("2026-08-21T00:06:00Z").getTime();

// The day rows a save produced, as { date: seconds }.
const writesByDate = (calls, field) =>
  Object.fromEntries(calls.map(([row]) => [row.date, row[field]]));

describe("a session that runs past midnight", () => {
  let listeners;

  beforeEach(() => {
    listeners = {};
    mockNavigation = {
      addListener: (event, cb) => {
        listeners[event] = cb;
        return () => {};
      },
    };
    mockUpsertDailyActivity.mockClear();
    mockInsertReadSession.mockClear();
    mockInsertAudioSession.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("credits reading to both days, split at the boundary", async () => {
    jest.setSystemTime(AT_2350);
    renderHook(() =>
      useReadingSession({
        baniId: 1,
        baniTitle: "Japji Sahib",
        navigation: mockNavigation,
        scrollPercentRef: { current: 0 },
      })
    );
    act(() => listeners.focus());

    jest.setSystemTime(AT_0006);
    await act(async () => {
      listeners.blur();
    });

    expect(writesByDate(mockUpsertDailyActivity.mock.calls, "reading_seconds_delta")).toEqual({
      "2026-08-20": 600,
      "2026-08-21": 360,
    });
    // The session row still spans the whole sitting, and its duration equals
    // the sum of the day rows.
    expect(mockInsertReadSession.mock.calls[0][0].duration_seconds).toBe(960);
  });

  it("credits listening to both days, split at the boundary", async () => {
    jest.setSystemTime(AT_2350);
    const { rerender } = renderHook(
      ({ playing }) =>
        useListeningSession({
          baniId: 2,
          baniTitle: "Rehras Sahib",
          isPlaying: playing,
          currentPlayingId: "track-1",
          artistId: "a1",
          artistName: "Artist",
        }),
      { initialProps: { playing: true } }
    );

    // Paused on the far side of midnight, then the screen is left.
    jest.setSystemTime(AT_0006);
    act(() => rerender({ playing: false }));
    await act(async () => {
      listeners.blur();
    });

    expect(writesByDate(mockUpsertDailyActivity.mock.calls, "listening_seconds_delta")).toEqual({
      "2026-08-20": 600,
      "2026-08-21": 360,
    });
    expect(mockInsertAudioSession.mock.calls[0][0].duration_played).toBe(960);
  });

  it("still writes a single day row when the session does not cross midnight", async () => {
    jest.setSystemTime(new Date("2026-08-20T09:00:00Z").getTime());
    renderHook(() =>
      useReadingSession({
        baniId: 1,
        baniTitle: "Japji Sahib",
        navigation: mockNavigation,
        scrollPercentRef: { current: 0 },
      })
    );
    act(() => listeners.focus());

    jest.setSystemTime(new Date("2026-08-20T09:16:00Z").getTime());
    await act(async () => {
      listeners.blur();
    });

    expect(mockUpsertDailyActivity).toHaveBeenCalledTimes(1);
    expect(writesByDate(mockUpsertDailyActivity.mock.calls, "reading_seconds_delta")).toEqual({
      "2026-08-20": 960,
    });
  });
});
