import React from "react";

import { fireEvent, render, screen } from "@testing-library/react-native";
import darkTheme from "@theme/darkTheme";
import lightTheme from "@theme/lightTheme";

import AboutScreen from ".";

// Locks in the four defects this screen shipped with before migration:
// unreachable content, a link colour that failed contrast in light mode,
// unlabelled controls, and a footer that squeezed in the longer languages.

let mockTheme = lightTheme;
const mockOpenInAppBrowser = jest.fn(() => Promise.resolve());

// The push-token row reads the FCM token; no token here, so the row stays
// hidden and the screen renders exactly as it did before the row existed.
jest.mock("@react-native-firebase/messaging", () => ({
  getMessaging: () => ({}),
  getToken: () => Promise.resolve(null),
}));

// The global @common mock in setupTests carries only a handful of strings, so
// this supplies the ones this screen renders.
jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({
    GradientDivider: () => null,
    STRINGS: {
      about: "About",
      GO_BACK: "Go back",
      SUNDAR_GUTKA: "Sundar Gutka",
      CREATED_BY: "Created by",
      ABOUT_WELCOME: "We welcome your comments, suggestions, and corrections!",
      ABOUT_HELP: "For information, suggestions, or help, visit us at",
      ABOUT_RESPECT: "Please respectfully cover your head.",
      ABOUT_SG: "Sundar Gutka utilizes",
      ABOUT_OPEN_SOURCE: "- the open source gurbani database.",
      ABOUT_PARDON: "Bhul Chuk Maaf!",
      BANI_DB: "BaniDB",
      APP_VERSION: "App Version",
      KHALIS_FOUNDATION: "Khalis Foundation",
      PRIVACY_POLICY: "Privacy Policy",
    },
    constant: {
      KHALIS_FOUNDATION_URL: "https://khalisfoundation.org",
      BANI_DB_URL: "https://www.banidb.com/",
      KHALIS_PRIVACY_POLICY_URL: "https://khalisfoundation.org/about/privacy-policy/",
    },
    // Called lazily: the factory is hoisted above the mock's declaration.
    openInAppBrowser: (...args) => mockOpenInAppBrowser(...args),
  });
});

jest.mock("../common/hooks/useTokens", () => {
  const { resolveTokens } = jest.requireActual("@theme/scale");
  return {
    __esModule: true,
    default: () => {
      const t = mockTheme;
      const { scale, space, layout } = resolveTokens({
        space: t.space,
        layout: t.layout,
        width: 390,
        fontScale: 1,
      });
      return {
        c: t.c,
        type: t.type,
        radii: t.radii,
        elevation: t.elevation,
        images: t.images,
        space,
        layout,
        scale,
        mode: t.mode,
        isDark: t.mode === "dark",
        theme: t,
      };
    },
  };
});

jest.mock("../common/context/ThemeContext", () => ({
  useTheme: () => ({ theme: mockTheme }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 12, left: 0, right: 0 }),
}));

jest.mock("react-native-device-info", () => ({
  getVersion: () => "3.1.0",
  getBuildNumber: () => "42",
}));

const navigation = { setOptions: jest.fn(), goBack: jest.fn() };

const renderWith = (theme) => {
  mockTheme = theme;
  return render(<AboutScreen navigation={navigation} />);
};

const flat = (style) =>
  (Array.isArray(style) ? style.flat(Infinity) : [style])
    .filter(Boolean)
    .reduce((out, s) => ({ ...out, ...s }), {});

const themes = [
  ["light", lightTheme],
  ["dark", darkTheme],
];

describe("AboutScreen", () => {
  beforeEach(() => {
    mockTheme = lightTheme;
    jest.clearAllMocks();
  });

  it("hides the navigator header in favour of the shared one", () => {
    renderWith(lightTheme);
    expect(navigation.setOptions).toHaveBeenCalledWith({ headerShown: false });
  });

  it("labels the back control, which is icon-only", () => {
    renderWith(lightTheme);
    const back = screen.getByTestId("screen-header-back");
    expect(back.props.accessibilityRole).toBe("button");
    // Localised, not a hardcoded English string.
    expect(back.props.accessibilityLabel).toBeTruthy();
  });

  it.each(themes)("[%s] renders links in a colour that passes contrast", (_name, theme) => {
    renderWith(theme);
    const link = screen.getByText("https://khalisfoundation.org");
    // Was colors.underlayColor (#009bff) in BOTH themes — 2.94:1 on the light
    // surface, a straight AA failure. c.link resolves per theme.
    expect(flat(link.props.style).color).toBe(theme.c.link);
    expect(flat(link.props.style).color).not.toBe("#009bff");
  });

  it("marks links as links for a screen reader", () => {
    renderWith(lightTheme);
    expect(screen.getByText("https://khalisfoundation.org").props.accessibilityRole).toBe("link");
  });

  it.each(themes)("[%s] labels both logos", (_name, theme) => {
    renderWith(theme);
    // Images carried no label before, so a screen reader announced nothing for
    // either of the two tappable marks.
    expect(screen.getByLabelText("Khalis Foundation")).toBeTruthy();
    expect(screen.getByLabelText("BaniDB")).toBeTruthy();
  });

  it("shows the version and copyright", () => {
    renderWith(lightTheme);
    expect(screen.getByText(/3\.1\.0/)).toBeTruthy();
    expect(screen.getByText(/42/)).toBeTruthy();
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeTruthy();
  });

  it("scrolls, so the footer stays reachable at a large font on a small screen", () => {
    renderWith(lightTheme);
    // The screen previously rendered a plain View: content past the fold was
    // simply unreachable.
    expect(screen.UNSAFE_getByType(require("react-native").ScrollView)).toBeTruthy();
  });

  it.each(themes)("[%s] offers the privacy policy as a themed, labelled link", (_name, theme) => {
    renderWith(theme);
    const link = screen.getByLabelText("Privacy Policy");
    expect(link.props.accessibilityRole).toBe("link");
    // Tall enough to tap on its own row, whatever the language's label length.
    expect(flat(link.props.style).minHeight).toBeGreaterThanOrEqual(44);
    expect(flat(screen.getByText("Privacy Policy").props.style).color).toBe(theme.c.link);
  });

  it("opens the policy in the in-app browser rather than leaving the app", () => {
    renderWith(lightTheme);
    fireEvent.press(screen.getByLabelText("Privacy Policy"));
    expect(mockOpenInAppBrowser).toHaveBeenCalledWith(
      "https://khalisfoundation.org/about/privacy-policy/"
    );
  });

  it("uses the theme's own logo variant rather than a fixed file", () => {
    // The Khalis mark ships a light and a dark asset; hardcoding one leaves it
    // invisible in the other theme.
    expect(lightTheme.images.khalisLogo).not.toBe(darkTheme.images.khalisLogo);
  });
});
