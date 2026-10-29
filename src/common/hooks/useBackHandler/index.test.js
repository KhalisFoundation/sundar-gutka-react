/* eslint-env jest */

import React from "react";
import { BackHandler } from "react-native";
import { render, act } from "@testing-library/react-native";
import useBackHandler from "./index";

// Mock BackHandler
let backPressHandler;
const mockRemove = jest.fn();

BackHandler.addEventListener = jest.fn((event, handler) => {
  if (event === "hardwareBackPress") {
    backPressHandler = handler;
  }
  return {
    remove: mockRemove,
  };
});

// Mock React Navigation
const mockGoBack = jest.fn();
const mockUseNavigation = jest.fn(() => ({
  goBack: mockGoBack,
}));

// useFocusEffect behaves exactly like useEffect for a screen that IS focused,
// which is the state every test here starts in. The blur case is exercised
// explicitly at the bottom by running the cleanup the hook returns.
const mockUseFocusEffect = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockUseNavigation(),
  // eslint-disable-next-line global-require
  useFocusEffect: (cb) => {
    mockUseFocusEffect(cb);
    // eslint-disable-next-line global-require
    return require("react").useEffect(cb, [cb]);
  },
}));

// Test component that uses the hook
const TestComponent = ({ handleBackPress }) => {
  useBackHandler(handleBackPress);
  return null;
};

describe("useBackHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    backPressHandler = null;
    mockUseNavigation.mockReturnValue({
      goBack: mockGoBack,
    });
  });

  it("should call navigation.goBack when handleBackPress is not provided", () => {
    render(<TestComponent />);

    act(() => {
      // Simulate hardware back press
      if (backPressHandler) {
        backPressHandler();
      }
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("should call navigation.goBack when handleBackPress is undefined", () => {
    render(<TestComponent handleBackPress={undefined} />);

    act(() => {
      if (backPressHandler) {
        backPressHandler();
      }
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("should call navigation.goBack when handleBackPress is null", () => {
    render(<TestComponent handleBackPress={null} />);

    act(() => {
      if (backPressHandler) {
        backPressHandler();
      }
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("should call custom handleBackPress when provided", () => {
    const customHandler = jest.fn(() => true);

    render(<TestComponent handleBackPress={customHandler} />);

    act(() => {
      if (backPressHandler) {
        backPressHandler();
      }
    });

    expect(customHandler).toHaveBeenCalledTimes(1);
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it("should call custom handleBackPress and respect its return value", () => {
    const customHandler = jest.fn(() => false);

    render(<TestComponent handleBackPress={customHandler} />);

    act(() => {
      if (backPressHandler) {
        backPressHandler();
      }
    });

    expect(customHandler).toHaveBeenCalledTimes(1);
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it("should not call navigation.goBack when handleBackPress is not a function", () => {
    render(<TestComponent handleBackPress="not-a-function" />);

    act(() => {
      if (backPressHandler) {
        backPressHandler();
      }
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("should not call navigation.goBack when handleBackPress is a number", () => {
    render(<TestComponent handleBackPress={123} />);

    act(() => {
      if (backPressHandler) {
        backPressHandler();
      }
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("should clean up event listener on unmount", () => {
    const { unmount } = render(<TestComponent />);

    unmount();

    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it("should update handler when handleBackPress changes", () => {
    const firstHandler = jest.fn(() => true);
    const secondHandler = jest.fn(() => true);

    const { rerender } = render(<TestComponent handleBackPress={firstHandler} />);

    act(() => {
      if (backPressHandler) {
        backPressHandler();
      }
    });

    expect(firstHandler).toHaveBeenCalledTimes(1);
    expect(secondHandler).not.toHaveBeenCalled();

    jest.clearAllMocks();

    rerender(<TestComponent handleBackPress={secondHandler} />);

    act(() => {
      if (backPressHandler) {
        backPressHandler();
      }
    });

    expect(secondHandler).toHaveBeenCalledTimes(1);
    expect(firstHandler).not.toHaveBeenCalled();
  });

  it("should handle navigation instance change", () => {
    const firstGoBack = jest.fn();
    const secondGoBack = jest.fn();

    mockUseNavigation.mockReturnValueOnce({ goBack: firstGoBack });

    const { rerender } = render(<TestComponent />);

    act(() => {
      if (backPressHandler) {
        backPressHandler();
      }
    });

    expect(firstGoBack).toHaveBeenCalledTimes(1);

    mockUseNavigation.mockReturnValueOnce({ goBack: secondGoBack });

    rerender(<TestComponent />);

    act(() => {
      if (backPressHandler) {
        backPressHandler();
      }
    });

    expect(secondGoBack).toHaveBeenCalledTimes(1);
  });

  // ── The bug this hook exists to prevent ──────────────────────────────────
  // A screen the user cannot see must not be able to answer the back button.
  it("SUBSCRIBES ON FOCUS, not on mount", () => {
    render(<TestComponent />);
    expect(mockUseFocusEffect).toHaveBeenCalled();
  });

  it("REGRESSION: releases the listener on blur, not only on unmount", () => {
    // Tab screens and stacked screens stay MOUNTED when they leave the screen.
    // Holding the listener until unmount is what let an invisible screen
    // swallow a back press meant for the visible one — which is how pressing
    // back on Folders or About exited the app instead of going back.
    render(<TestComponent />);
    const effect = mockUseFocusEffect.mock.calls[0][0];

    // Focus, then blur.
    const cleanup = effect();
    cleanup();

    expect(mockRemove).toHaveBeenCalled();
  });

  it("keeps ONE subscription across re-renders with an inline handler", () => {
    // Callers pass arrow functions, which are new on every render. Re-keying
    // the subscription on that identity would churn the listener constantly.
    const { rerender } = render(<TestComponent handleBackPress={() => true} />);
    const before = BackHandler.addEventListener.mock.calls.length;
    rerender(<TestComponent handleBackPress={() => true} />);
    expect(BackHandler.addEventListener.mock.calls.length).toBe(before);
  });
});
