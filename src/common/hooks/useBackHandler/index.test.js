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

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockUseNavigation(),
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

  // A screen stays mounted under the one pushed over it. Only the focused
  // screen may answer Back; otherwise the screen underneath pops itself out.
  it("leaves Back to the screen on top when this one is not focused", () => {
    const handleBackPress = jest.fn(() => true);
    mockUseNavigation.mockReturnValue({ goBack: mockGoBack, isFocused: () => false });

    render(<TestComponent handleBackPress={handleBackPress} />);

    let handled;
    act(() => {
      handled = backPressHandler();
    });

    expect(handled).toBe(false);
    expect(handleBackPress).not.toHaveBeenCalled();
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it("answers Back while focused", () => {
    const handleBackPress = jest.fn(() => true);
    mockUseNavigation.mockReturnValue({ goBack: mockGoBack, isFocused: () => true });

    render(<TestComponent handleBackPress={handleBackPress} />);

    act(() => {
      backPressHandler();
    });

    expect(handleBackPress).toHaveBeenCalledTimes(1);
  });
});
