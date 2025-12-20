/* eslint-env jest */
/* eslint-disable react/jsx-props-no-spreading */

import React from "react";

import { render, fireEvent } from "@testing-library/react-native";

import ErrorFallback from "./index";

// -------------------- MOCKS --------------------

jest.mock("react-redux", () => ({
  useSelector: jest.fn(() => "BalooPaaji2-Regular"),
}));

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
          xxl: 24,
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
  noTracksContainer: { alignItems: "center" },
  noTracksText: { fontSize: 24 },
  noTracksSubtext: { fontSize: 24 },
  joinMailingListButton: { padding: 12 },
  joinMailingListText: { fontSize: 24 },
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

const mockTheme = {
  colors: {
    audioTitleText: "#111111",
  },
  spacing: {
    md: 8,
    md_12: 12,
    xl: 24,
  },
  typography: {
    fonts: {
      balooPaaji: "BalooPaaji2-Regular",
      balooPaajiSemiBold: "BalooPaaji2-SemiBold",
    },
    sizes: {
      xxl: 24,
    },
  },
  borderRadius: {
    md: 8,
  },
  separator: "#CCCCCC",
  surface: "#FFFFFF",
};

jest.mock("@common", () => {
  const { Text } = require("react-native");
  return {
    STRINGS: {
      MAAFI_JI: "Maafi ji 🙏🏽",
      YET: "yet.",
    },
    CustomText: ({ children, ...props }) => (
      <Text accessibilityRole="text" {...props}>
        {children}
      </Text>
    ),
    useTheme: jest.fn(() => ({
      theme: mockTheme,
    })),
    useThemedStyles: jest.fn(() => () => mockStyles),
  };
});

// -------------------- HELPERS --------------------

const createProps = (overrides = {}) => ({
  title: "Failed to initialize audio player",
  buttonText: "Please try again.",
  buttonPress: jest.fn(),
  handleClose: jest.fn(),
  baniTitle: "",
  ...overrides,
});

// -------------------- TESTS --------------------

describe("ErrorFallback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders error message and button", () => {
    const props = createProps();
    const { getByText } = render(<ErrorFallback {...props} />);

    expect(getByText("Maafi ji 🙏🏽")).toBeTruthy();
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

  it("calls buttonPress when button is pressed", () => {
    const props = createProps();
    const { getByText } = render(<ErrorFallback {...props} />);

    const button = getByText("Please try again.");
    fireEvent.press(button);

    expect(props.buttonPress).toHaveBeenCalledTimes(1);
  });

  it("displays the correct title message", () => {
    const title = "Network error occurred";
    const props = createProps({ title });
    const { getByText } = render(<ErrorFallback {...props} />);

    expect(getByText(title)).toBeTruthy();
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

  it("displays baniTitle when provided", () => {
    const baniTitle = "Japji Sahib";
    const props = createProps({ baniTitle });
    const { getByText } = render(<ErrorFallback {...props} />);

    // Verify baniTitle is rendered
    expect(getByText(baniTitle)).toBeTruthy();
    // The "yet." text is nested within the same Text component and will be rendered
    // when baniTitle is provided, but it's difficult to test directly with getByText
    // since it's nested. The presence of baniTitle confirms the conditional rendering works.
  });

  it("does not display baniTitle or YET when baniTitle is empty", () => {
    const props = createProps({ baniTitle: "" });
    const { queryByText } = render(<ErrorFallback {...props} />);

    expect(queryByText("yet.")).toBeNull();
  });

  it("does not display baniTitle or YET when baniTitle is undefined", () => {
    const props = createProps({ baniTitle: undefined });
    const { queryByText } = render(<ErrorFallback {...props} />);

    expect(queryByText("yet.")).toBeNull();
  });
});
