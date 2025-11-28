/* eslint-env jest */
/* eslint-disable react/jsx-props-no-spreading */

import React from "react";

import { render, fireEvent } from "@testing-library/react-native";

import ErrorFallback from "./index";

// -------------------- MOCKS --------------------

jest.mock("@common/context", () => ({
  __esModule: true,
  default: () => ({
    theme: {
      mode: "light",
      colors: {
        audioTitleText: "#111111",
        primary: "#123456",
        surface: "#FFFFFF",
        separator: "#CCCCCC",
      },
      staticColors: {
        WHITE_COLOR: "#FFFFFF",
      },
      spacing: {
        xs: 2,
        sm: 4,
        md: 8,
        md_12: 12,
        lg: 16,
        xl: 24,
      },
      typography: {
        fonts: {
          balooPaaji: "BalooPaaji2-Regular",
          balooPaajiSemiBold: "BalooPaaji2-SemiBold",
        },
        sizes: {
          md_12: 12,
          lg: 16,
          xl: 20,
        },
      },
      borderRadius: {
        md: 8,
      },
    },
  }),
}));

const mockStyles = {
  statusContainer: { padding: 24 },
  closeButton: { position: "absolute" },
  statusTitle: { fontSize: 20 },
  statusSubtitle: { fontSize: 16 },
  retryButton: { padding: 12 },
  retryButtonText: { fontSize: 12 },
};

jest.mock("@common/hooks/useThemedStyles", () => () => () => mockStyles);

jest.mock("@common/icons", () => {
  const { Text } = require("react-native");
  return {
    CloseIcon: ({ size, color, testID, ...props }) => (
      <Text testID={testID || "close-icon"} {...props}>
        CloseIcon-{size}-{color}
      </Text>
    ),
  };
});

jest.mock("@common", () => {
  const { Text } = require("react-native");
  return {
    STRINGS: {
      PREPARING_AUDIO_PLAYER: "Preparing audio player...",
      PLEASE_TRY_AGAIN: "Please try again.",
    },
    CustomText: ({ children, ...props }) => (
      <Text accessibilityRole="text" {...props}>
        {children}
      </Text>
    ),
    useTheme: () => ({
      theme: {
        colors: {
          audioTitleText: "#111111",
        },
      },
    }),
    useThemedStyles: () => () => mockStyles,
  };
});

// -------------------- HELPERS --------------------

const createProps = (overrides = {}) => ({
  isInitializing: false,
  initializationErrorMessage: "Failed to initialize audio player",
  retryInitialization: jest.fn(),
  handleClose: jest.fn(),
  ...overrides,
});

// -------------------- TESTS --------------------

describe("ErrorFallback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly when initializing", () => {
    const props = createProps({ isInitializing: true });
    const { getByText, queryByText } = render(<ErrorFallback {...props} />);

    expect(getByText("Preparing audio player...")).toBeTruthy();
    expect(queryByText("Failed to initialize audio player")).toBeNull();
    expect(queryByText("Please try again.")).toBeNull();
  });

  it("renders error message and retry button when not initializing", () => {
    const props = createProps({ isInitializing: false });
    const { getByText } = render(<ErrorFallback {...props} />);

    expect(getByText("Preparing audio player...")).toBeTruthy();
    expect(getByText("Failed to initialize audio player")).toBeTruthy();
    expect(getByText("Please try again.")).toBeTruthy();
  });

  it("calls handleClose when close button is pressed", () => {
    const props = createProps();
    const { getByTestId } = render(<ErrorFallback {...props} />);

    const closeButton = getByTestId("close-button");
    fireEvent.press(closeButton);

    expect(props.handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls retryInitialization when retry button is pressed", () => {
    const props = createProps({ isInitializing: false });
    const { getByTestId } = render(<ErrorFallback {...props} />);

    const retryButton = getByTestId("retry-button");
    fireEvent.press(retryButton);

    expect(props.retryInitialization).toHaveBeenCalledTimes(1);
  });

  it("does not show retry button when initializing", () => {
    const props = createProps({ isInitializing: true });
    const { queryByText } = render(<ErrorFallback {...props} />);

    expect(queryByText("Please try again.")).toBeNull();
    expect(queryByText("Failed to initialize audio player")).toBeNull();
  });

  it("displays the correct initialization error message", () => {
    const errorMessage = "Network error occurred";
    const props = createProps({
      isInitializing: false,
      initializationErrorMessage: errorMessage,
    });
    const { getByText } = render(<ErrorFallback {...props} />);

    expect(getByText(errorMessage)).toBeTruthy();
  });

  it("renders close icon with correct props", () => {
    const props = createProps();
    const { getByTestId } = render(<ErrorFallback {...props} />);

    const closeButton = getByTestId("close-button");
    expect(closeButton).toBeTruthy();
  });

  it("renders status container with correct testID", () => {
    const props = createProps();
    const { getByTestId } = render(<ErrorFallback {...props} />);

    const container = getByTestId("error-fallback-container");
    expect(container).toBeTruthy();
  });

  it("renders status title with correct testID", () => {
    const props = createProps();
    const { getByTestId } = render(<ErrorFallback {...props} />);

    const statusTitle = getByTestId("status-title");
    expect(statusTitle).toBeTruthy();
    expect(statusTitle.props.children).toBe("Preparing audio player...");
  });

  it("renders status subtitle with correct testID when not initializing", () => {
    const props = createProps({ isInitializing: false });
    const { getByTestId } = render(<ErrorFallback {...props} />);

    const statusSubtitle = getByTestId("status-subtitle");
    expect(statusSubtitle).toBeTruthy();
    expect(statusSubtitle.props.children).toBe("Failed to initialize audio player");
  });
});
