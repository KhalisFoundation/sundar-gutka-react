/* eslint-env jest */
import React from "react";

import { act, fireEvent, render, renderHook, screen } from "@testing-library/react-native";
import lightTheme from "@theme/lightTheme";
import ScreenRolesProvider from "@theme/ScreenRolesProvider";

import {
  DISMISS_DISTANCE,
  DRAG_SLOP,
  FLING_VELOCITY,
  grabDecision,
  SheetHandle,
  shouldDismiss,
  useSheetMotion,
} from "./sheetDrag";

// Every sheet in the app closes when dragged down, the way Instagram's comment
// sheet does: from the grab bar and fixed header at the top, or from a
// scrolling list while it sits at its top — never from a list scrolled down,
// and never on a tap, so every button inside still takes its press.

// Scoped the way the real context is: inside a screen scope every role comes
// back as that screen's palette, here a stand-in colour.
jest.mock("../../context/ThemeContext", () => ({
  useTheme: () => {
    const theme = require("@theme/lightTheme").default;
    const scope = require("@theme/ScreenRolesProvider").useScreenRolesScope();
    return { theme: scope ? { ...theme, c: { ...theme.c, textSecondary: "#0000ff" } } : theme };
  },
}));

// The pan's handlers, captured so a drag can be played through them.
let mockPan = null;
// Whether the slide off the screen gets to finish.
let mockLeaveFinishes = true;
jest.mock("react-native-gesture-handler", () => {
  const { View } = require("react-native");
  return {
    GestureHandlerRootView: View,
    GestureDetector: ({ children }) => children,
    Gesture: {
      Pan: () => {
        const rec = { handlers: {}, manual: false };
        const chain = {
          manualActivation: (on) => {
            rec.manual = on;
            return chain;
          },
        };
        ["onTouchesDown", "onTouchesMove", "onStart", "onUpdate", "onEnd"].forEach((name) => {
          chain[name] = (fn) => {
            rec.handlers[name] = fn;
            return chain;
          };
        });
        mockPan = rec;
        return chain;
      },
    },
  };
});

// Plain objects for shared values, one per call, so the hook's state survives
// the re-renders a test causes as a real shared value does.
jest.mock("react-native-reanimated", () => {
  const { useRef } = require("react");
  return {
    __esModule: true,
    default: { View: require("react-native").View },
    useSharedValue: (initial) => useRef({ value: initial }).current,
    useAnimatedStyle: (fn) => fn(),
    // Runs to the end at once, so a close waiting on it happens in the test.
    withTiming: (to, config, onDone) => {
      onDone?.(mockLeaveFinishes);
      return to;
    },
    withSpring: (to) => to,
    runOnJS: (fn) => fn,
    interpolate: (value, [inMin, inMax], [outMin, outMax]) =>
      outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin),
    Extrapolation: { CLAMP: "clamp" },
    Easing: { out: (fn) => fn, cubic: (t) => t },
  };
});

const zone = { grabUntil: 60, bodyTop: 60, bodyBottom: 400, bodyScrolls: true, scrollY: 0 };

describe("where a drag may start", () => {
  it("waits until the touch has shown which way it is going", () => {
    expect(grabDecision({ ...zone, dx: 2, dy: DRAG_SLOP - 1, y: 10 })).toBe("wait");
  });

  it("drags from the grab zone at the top", () => {
    expect(grabDecision({ ...zone, dx: 0, dy: 20, y: 10 })).toBe("activate");
  });

  it("never drags upwards, so an upward scroll is the list's", () => {
    expect(grabDecision({ ...zone, dx: 0, dy: -20, y: 10 })).toBe("fail");
  });

  it("leaves a mostly sideways swipe alone", () => {
    expect(grabDecision({ ...zone, dx: 40, dy: 20, y: 10 })).toBe("fail");
  });

  it("drags from a scrolling list only while it is at its top", () => {
    expect(grabDecision({ ...zone, dx: 0, dy: 20, y: 200 })).toBe("activate");
    expect(grabDecision({ ...zone, scrollY: 120, dx: 0, dy: 20, y: 200 })).toBe("fail");
  });

  // A fixed body can hold something that moves vertically itself — the time
  // picker's wheels — so only the grab zone is offered.
  it("never drags from a body that is not a scroller", () => {
    expect(grabDecision({ ...zone, bodyScrolls: false, dx: 0, dy: 20, y: 200 })).toBe("fail");
  });

  it("never drags from below the body — the buttons and the keyboard", () => {
    expect(grabDecision({ ...zone, dx: 0, dy: 20, y: 450 })).toBe("fail");
  });
});

describe("when a released drag closes the sheet", () => {
  it("closes past the distance", () => {
    expect(shouldDismiss({ translationY: DISMISS_DISTANCE, velocityY: 0, height: 800 })).toBe(true);
    expect(shouldDismiss({ translationY: DISMISS_DISTANCE - 1, velocityY: 0, height: 800 })).toBe(
      false
    );
  });

  it("asks a short sheet for a quarter of its own height, not the full distance", () => {
    expect(shouldDismiss({ translationY: 60, velocityY: 0, height: 200 })).toBe(true);
  });

  it("closes on a flick however short the drag", () => {
    expect(shouldDismiss({ translationY: 10, velocityY: FLING_VELOCITY, height: 800 })).toBe(true);
  });

  it("never closes on an upward release", () => {
    expect(shouldDismiss({ translationY: -50, velocityY: 5000, height: 800 })).toBe(false);
  });
});

describe("the grab bar", () => {
  it("wears the app theme's icon colour, whatever screen palette it sits in", () => {
    render(<SheetHandle onClose={() => {}} />);
    const pill = screen.getByRole("button").props.children;
    expect(pill.props.style.backgroundColor).toBe(lightTheme.c.textSecondary);
  });

  // One colour per theme in every sheet: a screen palette must not recolour it.
  it("keeps that colour inside a screen-scoped sheet", () => {
    render(
      <ScreenRolesProvider screen="settings">
        <SheetHandle onClose={() => {}} />
      </ScreenRolesProvider>
    );
    const pill = screen.getByRole("button").props.children;
    expect(pill.props.style.backgroundColor).toBe(lightTheme.c.textSecondary);
  });

  it("is a close button to a screen reader, named in the app's language", () => {
    const onClose = jest.fn();
    render(<SheetHandle onClose={onClose} />);
    const bar = screen.getByRole("button");

    expect(bar.props.accessibilityLabel).toBe("Close");
    fireEvent(bar, "accessibilityAction", { nativeEvent: { actionName: "activate" } });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // A stray touch on the bar must not throw away a half-made pothi.
  it("does not close on an ordinary tap", () => {
    const onClose = jest.fn();
    render(<SheetHandle onClose={onClose} />);
    expect(screen.getByRole("button").props.onPress).toBeUndefined();
  });
});

describe("dragging a sheet", () => {
  const touch = (x, y) => ({ allTouches: [{ absoluteX: x, absoluteY: y, x, y }] });

  const open = (options = {}) => {
    const onClose = jest.fn();
    const { result, rerender } = renderHook(() =>
      useSheetMotion({ visible: true, onClose, bodyScrolls: true, ...options })
    );
    act(() => {
      result.current.onPanelLayout({ nativeEvent: { layout: { height: 600 } } });
      result.current.onBodyLayout({ nativeEvent: { layout: { y: 80, height: 400 } } });
    });
    return { onClose, result, rerender };
  };

  const drag = ({ fromY, by, velocityY = 0 }) => {
    const manager = { activate: jest.fn(), fail: jest.fn() };
    act(() => {
      mockPan.handlers.onTouchesDown(touch(100, fromY));
      mockPan.handlers.onTouchesMove(touch(100, fromY + by), manager);
      if (manager.activate.mock.calls.length) {
        mockPan.handlers.onUpdate({ translationY: by });
        mockPan.handlers.onEnd({ translationY: by, velocityY });
      }
    });
    return manager;
  };

  it("decides by hand, so a tap never starts it", () => {
    open();
    expect(mockPan.manual).toBe(true);
  });

  it("closes when pulled down far enough from the top", () => {
    const { onClose } = open();
    const manager = drag({ fromY: 20, by: 200 });
    expect(manager.activate).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // A sheet that takes itself down the moment it is closed would otherwise cut
  // the panel off part way down, which reads as a fade rather than a slide.
  it("closes only once the sheet has slid off the screen", () => {
    mockLeaveFinishes = false;
    const { onClose } = open();
    drag({ fromY: 20, by: 200 });
    mockLeaveFinishes = true;
    expect(onClose).not.toHaveBeenCalled();
  });

  it("springs back and stays open when let go short", () => {
    const { onClose, result, rerender } = open();
    drag({ fromY: 20, by: 40 });
    rerender();
    expect(onClose).not.toHaveBeenCalled();
    expect(result.current.panelStyle.transform[0].translateY).toBe(0);
  });

  it("scrolls a list that is not at its top instead of closing", () => {
    const { onClose, result } = open();
    act(() => result.current.onBodyScroll(150));
    const manager = drag({ fromY: 200, by: 200 });
    expect(manager.fail).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes from a list that is back at its top", () => {
    const { onClose, result } = open();
    act(() => result.current.onBodyScroll(0));
    drag({ fromY: 200, by: 200 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("thins the scrim as the sheet travels", () => {
    const { result, rerender } = open();
    act(() => {
      mockPan.handlers.onUpdate({ translationY: 300 });
    });
    rerender();
    expect(result.current.scrimStyle.opacity).toBeCloseTo(0.5, 5);
  });

  it("lets a sheet with nothing that scrolls be dragged from anywhere", () => {
    const { onClose } = open({ grabEverywhere: true, bodyScrolls: false });
    drag({ fromY: 500, by: 200 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// A caller's close is what a drag calls, so it must be the latest one.
describe("the close a drag calls", () => {
  it("is the one passed on the latest render", () => {
    const first = jest.fn();
    const latest = jest.fn();
    const { rerender, result } = renderHook(
      ({ onClose }) => useSheetMotion({ visible: true, onClose, grabEverywhere: true }),
      { initialProps: { onClose: first } }
    );
    rerender({ onClose: latest });
    act(() => {
      result.current.onPanelLayout({ nativeEvent: { layout: { height: 600 } } });
      mockPan.handlers.onEnd({ translationY: 300, velocityY: 0 });
    });
    expect(latest).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });
});

// Every close is the same slide as a drag's, whatever asked for it — a tap
// outside, back or Cancel used to shoot the panel 700px in 110ms instead.
describe("closing without a drag", () => {
  const shownAndMeasured = () => {
    const onClose = jest.fn();
    const hook = renderHook(({ visible }) => useSheetMotion({ visible, onClose }), {
      initialProps: { visible: true },
    });
    act(() => {
      hook.result.current.onShow();
      hook.result.current.onPanelLayout({ nativeEvent: { layout: { height: 600 } } });
    });
    return hook;
  };
  // The mocked animated style is read during render, and a close happens in the
  // effect after it, so one more render shows where the close has put things.
  const settle = (rerender, visible) => rerender({ visible });

  it("slides the sheet its own height, then unmounts it", () => {
    mockLeaveFinishes = false;
    const { result, rerender } = shownAndMeasured();
    rerender({ visible: false });
    settle(rerender, false);
    mockLeaveFinishes = true;
    expect(result.current.panelStyle.transform[0].translateY).toBe(600);
    expect(result.current.mounted).toBe(true);
  });

  it("thins the scrim as it goes, as a drag does", () => {
    mockLeaveFinishes = false;
    const { result, rerender } = shownAndMeasured();
    rerender({ visible: false });
    settle(rerender, false);
    mockLeaveFinishes = true;
    expect(result.current.scrimStyle.opacity).toBe(0);
  });

  it("unmounts once the slide has finished", () => {
    const { result, rerender } = shownAndMeasured();
    rerender({ visible: false });
    expect(result.current.mounted).toBe(false);
  });

  it("slides back up when reopened while still leaving", () => {
    mockLeaveFinishes = false;
    const { result, rerender } = shownAndMeasured();
    rerender({ visible: false });
    rerender({ visible: true });
    settle(rerender, true);
    mockLeaveFinishes = true;
    expect(result.current.mounted).toBe(true);
    expect(result.current.panelStyle.transform[0].translateY).toBe(0);
  });
});

// A sheet that first renders already open — the reminder sheet renders nothing
// until a reminder is picked — waits below the screen for `onShow`. It used to
// start in place for one frame, then drop out of sight and slide back up: a
// flicker on every open.
describe("a sheet mounted already open", () => {
  it("waits below the screen until it is shown", () => {
    const { result } = renderHook(() => useSheetMotion({ visible: true, onClose: jest.fn() }));
    expect(result.current.panelStyle.transform[0].translateY).toBeGreaterThan(0);
  });
});
