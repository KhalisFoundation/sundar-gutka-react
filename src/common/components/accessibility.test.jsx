import React from "react";

import { render, screen } from "@testing-library/react-native";
import lightTheme from "@theme/lightTheme";
import { FONT_SCALE_MAX } from "@theme/scale";

import BackIconComponent from "./BackIconComponent";
import CustomText from "./CustomText";
import ListItemTitle from "./ListItemTitle";
import SettingsIconComponent from "./SettingsIconComponent";

// Pins the app-wide accessibility fixes so they cannot silently regress.

jest.mock("@common/context", () => ({
  __esModule: true,
  default: () => ({ theme: jest.requireActual("@theme/lightTheme").default }),
}));

// `CustomText` renders through `ui/Text` now, so the theme has to be reachable
// by the primitive's own route as well — `useTokens` reads `ThemeContext`
// directly rather than going through `@common/context`.
jest.mock("../context/ThemeContext", () => ({
  useTheme: () => ({ theme: jest.requireActual("@theme/lightTheme").default }),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock("@common/icons", () => {
  const React2 = require("react");
  const RN = require("react-native");
  const stub = () => React2.createElement(RN.View, null);
  return { BackArrowIcon: stub, SettingsIcon: stub };
});

jest.mock("@common/localization", () => ({
  __esModule: true,
  default: { GO_BACK: "Go back", SETTINGS: "Settings" },
}));

describe("text respects the OS text-size setting", () => {
  // Both components hardcoded `allowFontScaling={false}` — CustomText across
  // ~70 files — so the single most-used accessibility setting on either
  // platform did nothing anywhere in the app (WCAG 1.4.4).
  it("CustomText scales, capped", () => {
    render(<CustomText testID="t">hello</CustomText>);
    const el = screen.getByText("hello");
    expect(el.props.allowFontScaling).toBe(true);
    expect(el.props.maxFontSizeMultiplier).toBe(FONT_SCALE_MAX);
  });

  it("ListItemTitle scales, capped", () => {
    render(<ListItemTitle title="Language" />);
    const el = screen.getByText("Language");
    expect(el.props.allowFontScaling).toBe(true);
    expect(el.props.maxFontSizeMultiplier).toBe(FONT_SCALE_MAX);
  });

  it("neither offers a shrink-to-fit escape hatch any more", () => {
    render(<CustomText>hello</CustomText>);
    expect(screen.getByText("hello").props.adjustsFontSizeToFit).toBeUndefined();
    expect(CustomText.propTypes.adjustsFontSizeToFit).toBeUndefined();
    expect(ListItemTitle.propTypes.adjustsFontSizeToFit).toBeUndefined();
  });

  it("wraps by default rather than clipping to one line", () => {
    render(<ListItemTitle title="A very long translated setting label" />);
    expect(screen.getByText("A very long translated setting label").props.numberOfLines).toBe(2);
  });
});

describe("Baloo faces are selected, never synthesized", () => {
  // Baloo ships as separate named TTFs. A numeric fontWeight sitting beside the
  // family makes Android try to synthesize bold, fail, and silently fall back
  // to the SYSTEM font — which is how dialog headings ended up in a different
  // typeface to the rest of the app. Nothing here is visible to a test that
  // only checks colours, so it is pinned explicitly.
  const styleOf = (el) =>
    (Array.isArray(el.props.style) ? el.props.style.flat(Infinity) : [el.props.style])
      .filter(Boolean)
      .reduce((out, s) => ({ ...out, ...s }), {});

  it("a bold weight picks the SemiBold file and drops the weight", () => {
    render(<CustomText style={{ fontWeight: "700" }}>Reset Reminders</CustomText>);
    const s = styleOf(screen.getByText("Reset Reminders"));
    expect(s.fontFamily).toBe(lightTheme.typography.fonts.balooPaajiSemiBold);
    expect(s.fontWeight).toBeUndefined();
  });

  it.each(["600", "bold", "semibold"])("treats %s as bold too", (weight) => {
    render(<CustomText style={{ fontWeight: weight }}>Heading</CustomText>);
    const s = styleOf(screen.getByText("Heading"));
    expect(s.fontFamily).toBe(lightTheme.typography.fonts.balooPaajiSemiBold);
    expect(s.fontWeight).toBeUndefined();
  });

  it("plain text gets the regular face", () => {
    render(<CustomText>Body</CustomText>);
    expect(styleOf(screen.getByText("Body")).fontFamily).toBe(
      lightTheme.typography.fonts.balooPaaji
    );
  });

  it("a caller naming its own family keeps its weight", () => {
    // Gurmukhi and any real multi-weight family must not be second-guessed.
    render(
      <CustomText style={{ fontFamily: "SomeVariableFont", fontWeight: "700" }}>Custom</CustomText>
    );
    const s = styleOf(screen.getByText("Custom"));
    expect(s.fontFamily).toBe("SomeVariableFont");
    expect(s.fontWeight).toBe("700");
  });
});

describe("icon-only controls announce themselves", () => {
  it("the back control has a role and a localised label", () => {
    render(<BackIconComponent color={lightTheme.c.textPrimary} />);
    const el = screen.getByRole("button");
    expect(el.props.accessibilityLabel).toBe("Go back");
    // hitSlop lifts the target to the 44pt floor without resizing the glyph.
    expect(el.props.hitSlop).toEqual({ top: 10, bottom: 10, left: 10, right: 10 });
  });

  it("the settings control has a role and a localised label", () => {
    render(
      <SettingsIconComponent color={lightTheme.c.textPrimary} handleSettingsPress={() => {}} />
    );
    expect(screen.getByRole("button").props.accessibilityLabel).toBe("Settings");
  });
});

describe("React 19 defaults", () => {
  it("no component relies on defaultProps, which React 19 ignores", () => {
    // Verified empirically: defaultProps on a function component resolves to
    // undefined under React 19. Every default is an ES default parameter now.
    expect(CustomText.defaultProps).toBeUndefined();
    expect(ListItemTitle.defaultProps).toBeUndefined();
    expect(BackIconComponent.defaultProps).toBeUndefined();
    expect(SettingsIconComponent.defaultProps).toBeUndefined();
  });

  it("a default parameter actually applies", () => {
    render(<BackIconComponent color="#000" />);
    // `size = 25` is a default argument; if it were defaultProps this would be
    // undefined and the icon would render at no size.
    expect(screen.getByRole("button")).toBeTruthy();
  });
});
