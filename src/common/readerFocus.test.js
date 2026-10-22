import { act, renderHook } from "@testing-library/react-native";
import { isReaderFocused, setReaderFocused, useReaderFocused } from "./readerFocus";

// The signal that tells the app's two root-level overlay hosts — the confirm
// dialog and the toast — that they are appearing ON the reading page and should
// wear the reading theme.

describe("readerFocus", () => {
  afterEach(() => setReaderFocused(false));

  it("starts false, because the Reader is not the launch screen", () => {
    expect(isReaderFocused()).toBe(false);
  });

  it("coerces whatever the navigation listener passes", () => {
    setReaderFocused("Reader");
    expect(isReaderFocused()).toBe(true);
    setReaderFocused(undefined);
    expect(isReaderFocused()).toBe(false);
  });

  it("re-renders a subscriber on change", () => {
    const { result } = renderHook(() => useReaderFocused());
    expect(result.current).toBe(false);
    act(() => setReaderFocused(true));
    expect(result.current).toBe(true);
    act(() => setReaderFocused(false));
    expect(result.current).toBe(false);
  });

  it("syncs a subscriber that mounts after the route settled", () => {
    // The toast host mounts once and outlives every screen, so it can easily
    // subscribe while the Reader is already open.
    setReaderFocused(true);
    const { result } = renderHook(() => useReaderFocused());
    expect(result.current).toBe(true);
  });

  it("notifies nothing when the value has not actually changed", () => {
    // Guards against a re-render storm: the navigation listener fires on every
    // state change, including ones that do not change the route.
    setReaderFocused(true);
    const seen = [];
    const { result } = renderHook(() => {
      const v = useReaderFocused();
      seen.push(v);
      return v;
    });
    const before = seen.length;
    act(() => setReaderFocused(true));
    expect(seen.length).toBe(before);
    expect(result.current).toBe(true);
  });

  it("drops its subscriber on unmount", () => {
    const { unmount } = renderHook(() => useReaderFocused());
    unmount();
    // Must not throw on a torn-down setState.
    expect(() => setReaderFocused(true)).not.toThrow();
  });
});
