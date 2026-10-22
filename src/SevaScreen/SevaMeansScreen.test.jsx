/* eslint-disable react/jsx-props-no-spreading */
/* eslint-env jest */
import React from "react";

import { render, waitFor, fireEvent } from "@testing-library/react-native";

import { getSevaMeansPage } from "../services/sevaMeans";

import SevaMeansScreen from "./SevaMeansScreen";

let mockState;
jest.mock("react-redux", () => ({
  useSelector: (selectorFn) => selectorFn(mockState),
}));

const mockOpenInAppBrowser = jest.fn();

jest.mock("@common", () => {
  const { View, Text } = require("react-native");
  const theme = {
    mode: "light",
    // The real semantic layer, so the stylesheet resolves the same roles the
    // app does instead of a hand-rolled subset that drifts from it.
    c: require("@theme/semanticColors").light,
    colors: { primary: "#123", surface: "#FFF", activeView: "#EEE" },
    staticColors: { WHITE_COLOR: "#FFF", NIGHT_BLACK: "#041126" },
    typography: {
      fonts: { balooPaaji: "F", balooPaajiSemiBold: "FSB" },
      sizes: { xxl: 22 },
      weights: { normal: "400" },
    },
  };
  return {
    SafeArea: (props) => <View {...props} />,
    StatusBarComponent: () => null,
    GradientDivider: () => null,
    CustomText: (props) => <Text {...props} />,
    useTheme: () => ({ theme }),
    useThemedStyles: (createStyles) => createStyles(theme),
    STRINGS: {
      SEVA: "Seva",
      RETRY: "Please try again.",
      SEVA_MEANS_LOAD_ERROR: "Unable to load this content.",
      SEVA_FOR_CODERS: "Seva for coders",
    },
    openInAppBrowser: (...args) => mockOpenInAppBrowser(...args),
    // The themed scrollbar hook. These tests assert content, not the thumb.
    useCustomScrollbar: () => ({ scrollViewProps: {}, Indicator: null, ownedScrollProps: {} }),
  };
});

// The screens render the SHARED header now, not a Seva-only AppBar. Stubbed for
// the same reason the AppBar was: these tests are about the server-driven body,
// and rendering the real header would drag the whole token layer in behind it.
jest.mock("@common/components/ui", () => {
  const { Text, View } = require("react-native");
  return {
    ScreenHeader: ({ title }) => <Text>{title}</Text>,
    Spinner: () => <View testID="spinner" />,
  };
});

jest.mock("../common/icons", () => ({
  ChevronRight: () => null,
}));

jest.mock("./socialIcons", () => ({
  detectSocialBrand: () => null,
  SocialBadge: () => null,
}));

jest.mock("../services/sevaMeans", () => ({
  getSevaMeansPage: jest.fn(),
}));

const navigation = { goBack: jest.fn() };
const routeFor = (page) => ({ params: { page } });

beforeEach(() => {
  jest.clearAllMocks();
  mockState = { language: "en" };
});

describe("SevaMeansScreen", () => {
  it("renders server-driven content natively (intro + link) and the header title", async () => {
    getSevaMeansPage.mockResolvedValue({
      title: "Seva for Coders",
      version: 1,
      source: "network",
      segments: [
        {
          type: "html",
          value:
            '<p class="seva-intro">Love to code?</p>' +
            '<p class="seva-link"><a href="https://github.com/x">GitHub</a> — repo</p>',
        },
      ],
    });

    const { getByText, getAllByText } = render(
      <SevaMeansScreen route={routeFor("coding")} navigation={navigation} />
    );

    await waitFor(() => expect(getByText("Love to code?")).toBeTruthy());
    // Title shows in the AppBar.
    expect(getAllByText("Seva for Coders").length).toBeGreaterThan(0);
    // The link renders and opens in the in-app browser.
    fireEvent.press(getByText("GitHub"));
    expect(mockOpenInAppBrowser).toHaveBeenCalledWith("https://github.com/x", expect.any(Object));
  });

  it("shows the error state with a retry when content can't be produced", async () => {
    getSevaMeansPage.mockResolvedValue(null);
    const { getByText } = render(
      <SevaMeansScreen route={routeFor("other")} navigation={navigation} />
    );
    await waitFor(() => expect(getByText("Unable to load this content.")).toBeTruthy());
    expect(getByText("Please try again.")).toBeTruthy();
  });

  it("requests the page for the route's page key and current language", async () => {
    getSevaMeansPage.mockResolvedValue({
      title: "t",
      segments: [{ type: "html", value: "<p>x</p>" }],
      source: "network",
    });
    render(<SevaMeansScreen route={routeFor("qa")} navigation={navigation} />);
    await waitFor(() => expect(getSevaMeansPage).toHaveBeenCalledWith({ page: "qa", lang: "en" }));
  });
});
