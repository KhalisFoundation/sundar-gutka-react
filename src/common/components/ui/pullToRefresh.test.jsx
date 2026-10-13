import React from "react";
import { Text } from "react-native";

import { act, render } from "@testing-library/react-native";

import PullToRefresh from "./PullToRefresh";

// The app's one pull-to-refresh. It is a pan rather than a platform refresh
// control because neither control can work inside a DraggableFlatList (see the
// component), and a pan sitting over a scrolling list is only safe because of
// the two rules tested here: it arms ONLY at the top, and travels DOWN only.

// Records how the gesture was built, and lets a test drive it.
let mockPan;
jest.mock("react-native-gesture-handler", () => {
  const { View } = require("react-native");
  return {
    GestureDetector: ({ children }) => children,
    Gesture: {
      Pan: () => {
        const rec = { config: {}, handlers: {} };
        const chain = {
          withRef: (v) => {
            rec.config.ref = v;
            return chain;
          },
          enabled: (v) => {
            rec.config.enabled = v;
            return chain;
          },
          activeOffsetY: (v) => {
            rec.config.activeOffsetY = v;
            return chain;
          },
          failOffsetX: (v) => {
            rec.config.failOffsetX = v;
            return chain;
          },
          onUpdate: (fn) => {
            rec.handlers.onUpdate = fn;
            return chain;
          },
          onEnd: (fn) => {
            rec.handlers.onEnd = fn;
            return chain;
          },
        };
        mockPan = rec;
        return chain;
      },
    },
    View,
  };
});

// One shared value for the whole render, so a pull survives the re-render its
// own state changes cause — as a real shared value does.
jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  const shared = { value: 0 };
  return {
    __esModule: true,
    default: { View },
    useSharedValue: () => shared,
    useAnimatedStyle: () => ({}),
    withTiming: (v) => v,
    runOnJS: (fn) => fn,
  };
});

jest.mock("@common/hooks/useTokens", () => () => ({
  c: { textPrimary: "#000", surface: "#fff" },
  space: { md: 12, lg: 16 },
  radii: { lg: 12 },
  elevation: { raised: {}, card: {} },
}));
jest.mock("./Spinner", () => () => null);

const open = (props = {}) =>
  render(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <PullToRefresh atTop surface="#fff" onRefresh={jest.fn(() => Promise.resolve())} {...props}>
      <Text>content</Text>
    </PullToRefresh>
  );

// The gesture damps travel by half, so the finger moves well past the trigger.
const pull = (by) =>
  act(() => {
    mockPan.handlers.onUpdate({ translationY: by });
    mockPan.handlers.onEnd();
  });

beforeEach(() => {
  mockPan = null;
});

it("renders what it is given", () => {
  expect(open().getByText("content")).toBeTruthy();
});

// A single positive value sets the END threshold alone, so an upward drag can
// never activate the gesture and scrolling away from the top is untouched.
it("travels downwards only", () => {
  open();
  expect(mockPan.config.activeOffsetY).toBeGreaterThan(0);
  expect(Array.isArray(mockPan.config.activeOffsetY)).toBe(false);
});

it("arms only at the top of the content", () => {
  open({ atTop: false });
  expect(mockPan.config.enabled).toBe(false);
});

it("stays off where the caller says there is nothing to refresh", () => {
  open({ enabled: false });
  expect(mockPan.config.enabled).toBe(false);
});

it("refreshes when the pull is let go past the trigger", async () => {
  const onRefresh = jest.fn(() => Promise.resolve());
  open({ onRefresh });
  await act(async () => pull(400));
  expect(onRefresh).toHaveBeenCalled();
});

it("does nothing when the pull is let go short of it", async () => {
  const onRefresh = jest.fn(() => Promise.resolve());
  open({ onRefresh });
  await act(async () => pull(40));
  expect(onRefresh).not.toHaveBeenCalled();
});

// One refresh at a time: a second pull while the first is still running would
// fire the same request twice.
it("holds the pull off until the refresh has finished", async () => {
  let settle;
  const onRefresh = jest.fn(
    () =>
      new Promise((resolve) => {
        settle = resolve;
      })
  );
  open({ onRefresh });

  await act(async () => pull(400));
  expect(mockPan.config.enabled).toBe(false);

  await act(async () => {
    settle();
  });
  expect(mockPan.config.enabled).toBe(true);
});

// A list whose own scroll view would otherwise claim the touch has to be told
// to run simultaneously with this gesture, which needs it to have a ref.
it("publishes its gesture on the ref a list is given", () => {
  const gestureRef = { current: null };
  open({ gestureRef });
  expect(mockPan.config.ref).toBe(gestureRef);
});
