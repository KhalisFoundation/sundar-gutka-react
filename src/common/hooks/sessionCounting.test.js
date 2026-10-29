/* eslint-env jest */
import { AppState } from "react-native";
import { act, renderHook } from "@testing-library/react-native";
import useListeningSession from "./useListeningSession";
import useReadingSession from "./useReadingSession";

const mockUpsertDailyActivity = jest.fn();
const mockInsertReadSession = jest.fn();
const mockInsertAudioSession = jest.fn();
const mockIncrementReadCount = jest.fn();
let mockNavigation;

jest.mock("@common", () => ({
  logError: jest.fn(),
  logMessage: jest.fn(),
  trackBaniCompleted: jest.fn(() => Promise.resolve()),
  trackAudioStarted: jest.fn(() => Promise.resolve()),
  trackAudioCompleted: jest.fn(() => Promise.resolve()),
}));
jest.mock("@react-navigation/native", () => ({ useNavigation: () => mockNavigation }));
jest.mock("../../database/analytics", () => ({
  insertReadSession: (...a) => mockInsertReadSession(...a),
  insertAudioSession: (...a) => mockInsertAudioSession(...a),
  upsertDailyActivity: (...a) => mockUpsertDailyActivity(...a),
  incrementBaniReadCount: (...a) => mockIncrementReadCount(...a),
  enqueueAnalyticsWrite: (fn) => fn(),
}));
jest.mock("../../services/dashboard/syncSignal", () => ({ requestPush: jest.fn() }));

let listeners;
let appStateListener;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-08-20T10:00:00Z").getTime());
  listeners = {};
  mockNavigation = {
    addListener: (event, cb) => {
      listeners[event] = cb;
      return () => {};
    },
  };
  jest.spyOn(AppState, "addEventListener").mockImplementation((_e, cb) => {
    appStateListener = cb;
    return { remove: jest.fn() };
  });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const passMinutes = (n) => jest.setSystemTime(Date.now() + n * 60000);

describe("reading", () => {
  const mountReader = (scroll = 100) =>
    renderHook(() =>
      useReadingSession({
        baniId: 2,
        baniTitle: "Japji Sahib",
        navigation: mockNavigation,
        scrollPercentRef: { current: scroll },
      })
    );

  // Every background flushes a session. Beside a finished bani each one added a
  // read and a completion, and the all-time totals keep the larger figure.
  it("counts a finished bani once however often the app goes to the background", () => {
    mountReader();
    act(() => listeners.focus());
    const cycle = () => {
      passMinutes(1);
      act(() => appStateListener("background"));
      act(() => appStateListener("active"));
    };
    cycle();
    cycle();
    cycle();
    passMinutes(1);
    act(() => listeners.blur());
    const completions = mockInsertReadSession.mock.calls.filter(([row]) => row.completed);
    expect(completions).toHaveLength(1);
    expect(mockIncrementReadCount).toHaveBeenCalledTimes(1);
    // The time itself still all counts.
    const seconds = mockUpsertDailyActivity.mock.calls.reduce(
      (sum, [row]) => sum + row.reading_seconds_delta,
      0
    );
    expect(seconds).toBe(240);
  });

  // iOS: the app switcher makes the app inactive, and a swipe from there ends
  // it with no background event.
  it("saves the sitting when the app goes inactive", () => {
    mountReader(0);
    act(() => listeners.focus());
    passMinutes(5);
    act(() => appStateListener("inactive"));
    expect(mockUpsertDailyActivity).toHaveBeenCalledWith(
      expect.objectContaining({ reading_seconds_delta: 300 })
    );
  });

  it("does not time reading while another screen is on top", () => {
    mountReader(0);
    act(() => listeners.focus());
    passMinutes(1);
    act(() => listeners.blur()); // Settings pushed on top
    act(() => appStateListener("background"));
    act(() => appStateListener("active"));
    passMinutes(10);
    act(() => listeners.focus());
    passMinutes(1);
    act(() => listeners.blur());
    const seconds = mockUpsertDailyActivity.mock.calls.reduce(
      (sum, [row]) => sum + row.reading_seconds_delta,
      0
    );
    expect(seconds).toBe(120);
  });
});

describe("listening", () => {
  // Audio plays on with the phone locked; an app killed there used to lose all
  // of it, because nothing was written until the Reader was left.
  it("writes the time down when the app goes to the background, and goes on counting", () => {
    const { rerender } = renderHook(
      ({ playing }) => useListeningSession({ baniId: 21, baniTitle: "Rehras", isPlaying: playing }),
      { initialProps: { playing: true } }
    );
    passMinutes(5);
    act(() => appStateListener("background"));
    expect(mockUpsertDailyActivity).toHaveBeenCalledWith(
      expect.objectContaining({ listening_seconds_delta: 300 })
    );
    expect(mockInsertAudioSession).not.toHaveBeenCalled();

    passMinutes(2);
    rerender({ playing: false });
    act(() => listeners.blur());
    const total = mockUpsertDailyActivity.mock.calls.reduce(
      (sum, [row]) => sum + row.listening_seconds_delta,
      0
    );
    expect(total).toBe(420);
    // One session row, for the whole of it.
    expect(mockInsertAudioSession).toHaveBeenCalledTimes(1);
    expect(mockInsertAudioSession.mock.calls[0][0].duration_played).toBe(420);
  });

  // The playback state is the one global player's. A Reader left under another
  // Reader saw that audio as its own and counted every second a second time.
  it("does not count audio playing in another Reader", () => {
    mockNavigation.isFocused = () => false;
    const { unmount } = renderHook(() =>
      useListeningSession({ baniId: 21, baniTitle: "Rehras", isPlaying: true })
    );
    act(() => {
      jest.advanceTimersByTime(3 * 60 * 1000);
    });
    passMinutes(3);
    act(() => appStateListener("background"));
    unmount();
    expect(mockUpsertDailyActivity).not.toHaveBeenCalled();
    expect(mockInsertAudioSession).not.toHaveBeenCalled();
  });

  it("checkpoints while it plays", () => {
    renderHook(() => useListeningSession({ baniId: 21, baniTitle: "Rehras", isPlaying: true }));
    act(() => {
      jest.advanceTimersByTime(60 * 1000);
    });
    expect(mockUpsertDailyActivity).toHaveBeenCalledWith(
      expect.objectContaining({ listening_seconds_delta: 60 })
    );
  });
});

// The Reader is reused across banis: a notification tapped while reading swaps
// the bani in place. The old closure credited the old bani again and the new
// one never.
describe("a bani swapped in place", () => {
  it("files each sitting under its own bani, and counts each once", () => {
    const scroll = { current: 100 };
    const { rerender } = renderHook(
      ({ id }) =>
        useReadingSession({
          baniId: id,
          baniTitle: `b${id}`,
          navigation: mockNavigation,
          scrollPercentRef: scroll,
        }),
      { initialProps: { id: 2 } }
    );
    act(() => listeners.focus());
    passMinutes(5);
    rerender({ id: 6 });
    passMinutes(10);
    act(() => listeners.blur());
    const rows = mockInsertReadSession.mock.calls.map(([r]) => [r.bani_id, r.duration_seconds]);
    expect(rows).toEqual([
      [2, 300],
      [6, 600],
    ]);
    expect(mockIncrementReadCount.mock.calls.map(([id]) => id)).toEqual([2, 6]);
  });

  it("goes on counting audio that plays across the swap", () => {
    const { rerender } = renderHook(
      ({ id }) => useListeningSession({ baniId: id, baniTitle: `b${id}`, isPlaying: true }),
      { initialProps: { id: 2 } }
    );
    passMinutes(1);
    rerender({ id: 6 });
    passMinutes(15);
    act(() => listeners.blur());
    const sessions = mockInsertAudioSession.mock.calls.map(([r]) => [r.bani_id, r.duration_played]);
    expect(sessions).toEqual([
      [2, 60],
      [6, 900],
    ]);
  });
});

// With the screen kept awake, a bani left open on a stand counted every hour.
it("stops counting a Reader nobody is scrolling", () => {
  renderHook(() =>
    useReadingSession({
      baniId: 2,
      baniTitle: "Japji",
      navigation: mockNavigation,
      scrollPercentRef: { current: 10 },
    })
  );
  act(() => listeners.focus());
  act(() => {
    jest.advanceTimersByTime(60 * 60 * 1000);
  });
  const seconds = mockUpsertDailyActivity.mock.calls.reduce(
    (sum, [row]) => sum + row.reading_seconds_delta,
    0
  );
  // The last scroll, plus a screenful's grace — not the hour.
  expect(seconds).toBe(120);
  act(() => listeners.blur());
  expect(mockInsertReadSession).toHaveBeenCalledTimes(1);
});

describe("reading a bani again", () => {
  const mount = (scroll) =>
    renderHook(() =>
      useReadingSession({
        baniId: 2,
        baniTitle: "Japji",
        navigation: mockNavigation,
        scrollPercentRef: scroll,
      })
    );

  // The Reader stays mounted overnight; the same bani read the next morning
  // was neither counted nor ticked.
  it("counts it again on a new day", () => {
    const scroll = { current: 100 };
    mount(scroll);
    act(() => listeners.focus());
    passMinutes(5);
    act(() => appStateListener("background"));
    jest.setSystemTime(Date.now() + 24 * 60 * 60 * 1000);
    act(() => appStateListener("active"));
    passMinutes(5);
    act(() => listeners.blur());
    const completions = mockInsertReadSession.mock.calls.filter(([r]) => r.completed);
    expect(completions).toHaveLength(2);
    expect(mockIncrementReadCount).toHaveBeenCalledTimes(2);
  });

  it("counts it again when read from the top once more", () => {
    const scroll = { current: 0 };
    mount(scroll);
    act(() => listeners.focus());
    scroll.current = 100;
    act(() => {
      jest.advanceTimersByTime(30 * 1000);
    });
    scroll.current = 0;
    act(() => {
      jest.advanceTimersByTime(30 * 1000);
    });
    scroll.current = 100;
    act(() => {
      jest.advanceTimersByTime(30 * 1000);
    });
    act(() => listeners.blur());
    const completions = mockInsertReadSession.mock.calls.filter(([r]) => r.completed);
    expect(completions).toHaveLength(2);
  });

  // The Reader zeroes its scroll on a bani swap before the old sitting is
  // saved, and a reader who finished and scrolled back up had still finished.
  it("keeps the furthest point reached", () => {
    const scroll = { current: 98 };
    mount(scroll);
    act(() => listeners.focus());
    act(() => {
      jest.advanceTimersByTime(30 * 1000);
    });
    scroll.current = 40;
    act(() => listeners.blur());
    expect(mockInsertReadSession.mock.calls[0][0].completed).toBe(true);
  });
});
