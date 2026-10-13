import React from "react";
import { ScrollView } from "react-native";

import { act, render, screen, within } from "@testing-library/react-native";
import darkTheme from "@theme/darkTheme";
import lightTheme from "@theme/lightTheme";
import { FONT_SCALE_MAX } from "@theme/scale";

import Button from "./Button";
import Card from "./Card";
import Dialog from "./Dialog";
import Row from "./Row";
import ScreenHeader from "./ScreenHeader";
import Sheet from "./Sheet";
import Text from "./Text";
import Toast from "./Toast";

// These primitives are the contract the rest of the overhaul depends on, so the
// tests assert the properties that actually broke the old components rather
// than that they render: font scaling on, nothing fixed-height, long strings
// absorbed, and both themes exercised.

// `mock` prefix so the jest.mock factory may close over it. The primitives
// resolve real token values this way, so these tests exercise the actual
// palette and scale rather than a stub.
let mockTheme = lightTheme;

jest.mock("../../context/ThemeContext", () => ({
  useTheme: () => ({ theme: mockTheme }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 12, left: 0, right: 0 }),
}));

// Pinned to a reference phone so assertions can use the design values
// directly. React Native's own jest setup reports fontScale 2, which would
// otherwise scale every token and make these numbers device-dependent.
const REFERENCE = { width: 390, height: 844, scale: 3, fontScale: 1 };
let mockWindow = REFERENCE;

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => mockWindow,
}));

beforeEach(() => {
  mockWindow = REFERENCE;
  mockTheme = lightTheme;
});

const withTheme = (theme, ui) => {
  mockTheme = theme;
  return render(ui);
};

/** Renders on a small phone at the largest OS font — the worst realistic case. */
const withSmallDeviceLargeFont = (ui) => {
  mockWindow = { width: 320, height: 568, scale: 2, fontScale: 1.5 };
  return render(ui);
};

/** The longest realistic translation of a short English label, in Punjabi. */
const LONG_LABEL = "ਸਾਰੀਆਂ ਡਾਊਨਲੋਡ ਕੀਤੀਆਂ ਆਡੀਓ ਫਾਈਲਾਂ ਹਟਾਓ ਅਤੇ ਬੰਦ ਕਰੋ";
const LONG_MESSAGE =
  "ਨੈੱਟਵਰਕ ਗਲਤੀ, ਆਡੀਓ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ ਅਸਥਾਈ ਤੌਰ 'ਤੇ ਉਪਲਬਧ ਨਹੀਂ ਹਨ। ਕਿਰਪਾ ਕਰਕੇ ਬਾਅਦ ਵਿੱਚ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।";

/** Flattens a possibly-nested RN style prop into one object. */
const flat = (style) =>
  (Array.isArray(style) ? style.flat(Infinity) : [style])
    .filter(Boolean)
    .reduce((out, s) => ({ ...out, ...s }), {});

const themes = [
  ["light", lightTheme],
  ["dark", darkTheme],
];

describe("Text", () => {
  it.each(themes)("[%s] scales with the OS font setting, capped", (_name, theme) => {
    withTheme(theme, <Text testID="t">hello</Text>);
    const el = screen.getByTestId("t");
    // The defect this replaces: CustomText hardcoded allowFontScaling={false}
    // in 72 files, so the app ignored the OS text-size setting entirely.
    expect(el.props.allowFontScaling).toBe(true);
    expect(el.props.maxFontSizeMultiplier).toBe(FONT_SCALE_MAX);
  });

  it("never auto-shrinks to fit", () => {
    withTheme(lightTheme, <Text testID="t">{LONG_LABEL}</Text>);
    expect(screen.getByTestId("t").props.adjustsFontSizeToFit).toBeFalsy();
  });

  it.each(themes)("[%s] resolves a colour role from the theme", (_name, theme) => {
    withTheme(theme, <Text testID="t" color="textSecondary" />);
    expect(flat(screen.getByTestId("t").props.style).color).toBe(theme.c.textSecondary);
  });

  it("carries size and face together", () => {
    withTheme(lightTheme, <Text testID="t" variant="heading" />);
    const s = flat(screen.getByTestId("t").props.style);
    expect(s.fontSize).toBe(lightTheme.type.heading.fontSize);
    expect(s.fontFamily).toBe(lightTheme.type.heading.fontFamily);
  });

  // Asserted as a literal absence, not against the theme. This used to read
  // `expect(s.lineHeight).toBe(lightTheme.type.heading.lineHeight)`, which is
  // self-referential — it would pass whatever the scale said, including the
  // squeezed values that misaligned hi/pa text on Realme and on tablets. See
  // `theme/typeMetrics.test.js` for the threshold this protects.
  it("imposes no line height, so the face supplies its own", () => {
    withTheme(lightTheme, <Text testID="t" variant="heading" />);
    expect(flat(screen.getByTestId("t").props.style).lineHeight).toBeUndefined();
  });

  it("falls back to body for an unknown variant rather than rendering unstyled", () => {
    withTheme(lightTheme, <Text testID="t" variant="nope" />);
    expect(flat(screen.getByTestId("t").props.style).fontSize).toBe(lightTheme.type.body.fontSize);
  });
});

describe("Button", () => {
  it.each(themes)("[%s] meets the 44pt touch-target floor", (_name, theme) => {
    withTheme(theme, <Button testID="b" title="Save" onPress={() => {}} />);
    expect(flat(screen.getByTestId("b").props.style).minHeight).toBeGreaterThanOrEqual(44);
  });

  it("has no fixed width or height, so a long translation fits", () => {
    withTheme(lightTheme, <Button testID="b" title={LONG_LABEL} onPress={() => {}} />);
    const s = flat(screen.getByTestId("b").props.style);
    expect(s.width).toBeUndefined();
    expect(s.height).toBeUndefined();
    expect(s.minHeight).toBeGreaterThan(0);
  });

  it("announces itself and its disabled state", () => {
    withTheme(lightTheme, <Button testID="b" title="Save" onPress={() => {}} disabled />);
    const el = screen.getByTestId("b");
    expect(el.props.accessibilityRole).toBe("button");
    expect(el.props.accessibilityLabel).toBe("Save");
    expect(el.props.accessibilityState.disabled).toBe(true);
  });

  it("shows a spinner instead of the label while loading", () => {
    withTheme(lightTheme, <Button testID="b" title="Save" onPress={() => {}} loading />);
    expect(screen.getByTestId("button-spinner")).toBeTruthy();
    expect(screen.queryByText("Save")).toBeNull();
  });

  // The fill is its OWN role, not the error text colour: text has to clear
  // 4.5:1 on every surface, which made light mode's red darker than a whole
  // button should look.
  it.each(themes)("[%s] destructive fill keeps its label legible", (_name, theme) => {
    withTheme(theme, <Button testID="b" title="Delete" onPress={() => {}} variant="destructive" />);
    expect(flat(screen.getByTestId("b").props.style).backgroundColor).toBe(theme.c.errorFill);
    expect(flat(screen.getByText("Delete").props.style).color).toBe(theme.c.onErrorFill);
  });
});

describe("Row", () => {
  it("gives only the text column room to grow", () => {
    withTheme(lightTheme, <Row testID="r" title={LONG_LABEL} subtitle={LONG_LABEL} />);
    // A two-line row is taller, never a fixed height that would clip.
    const s = flat(screen.getByTestId("r").props.style);
    expect(s.height).toBeUndefined();
    expect(s.minHeight).toBe(lightTheme.layout.row.minHeightTwoLine);
  });

  it("grows on a small phone at the largest font instead of clipping", () => {
    withSmallDeviceLargeFont(<Row testID="r" title={LONG_LABEL} />);
    const grown = flat(screen.getByTestId("r").props.style).minHeight;
    // Container minimums track the font scale at the full rate, precisely so
    // the text still fits after the user enlarges it.
    expect(grown).toBeGreaterThan(lightTheme.layout.row.minHeight);
    expect(grown).toBe(Math.round(lightTheme.layout.row.minHeight * 1.5));
  });

  // ── The title and its value dividing one line ────────────────────────────
  // The bug these guard: the title column was `flex: 1`, which is
  // `flexBasis: 0%` — it began at zero width and lived on leftovers, so the
  // value took the line first and the title wrapped one character per row
  // ("Re / mi / nd / er") or vanished entirely, worst in the longer languages.

  /**
   * The flexible middle column, found by walking up from the title it holds to
   * the first ancestor that flexes. Walked rather than reached by `.parent`,
   * which lands on whichever host element the Text primitive happens to render
   * into and would break on a change that has nothing to do with this.
   */
  const titleColumn = (title) => {
    for (let node = screen.getByText(title); node; node = node.parent) {
      const style = flat(node.props?.style);
      if (style.flexGrow !== undefined) return style;
    }
    return {};
  };

  it("starts the title column from its own width, not from zero", () => {
    withTheme(lightTheme, <Row testID="r" title="Reminder Sound" value="Waheguru Soul" />);
    const col = titleColumn("Reminder Sound");
    // `flexBasis: "auto"` is the whole fix: the title's intrinsic width takes
    // part in the layout, so the two columns shrink in proportion rather than
    // one being served in full and the other getting the remainder.
    expect(col.flexBasis).toBe("auto");
    expect(col.flexGrow).toBe(1);
    expect(col.flexShrink).toBe(1);
    // `flex: 1` would reintroduce flexBasis 0 and the bug with it.
    expect(col.flex).toBeUndefined();
  });

  it("caps the value so it can never claim the whole line", () => {
    withTheme(lightTheme, <Row testID="r" title="Bani Font" value={LONG_LABEL} />);
    const value = flat(screen.getByText(LONG_LABEL).props.style);
    expect(value.maxWidth).toBe("45%");
    expect(value.flexShrink).toBe(1);
  });

  it("drops the value under the title once no division of the line works", () => {
    withSmallDeviceLargeFont(<Row testID="r" title="Reminder Sound" value="Waheguru Soul" />);
    const value = flat(screen.getByText("Waheguru Soul").props.style);
    // Stacked it owns the full width, so it needs neither cap nor shrink, and
    // it reads from the left like the title above it rather than right-aligned.
    expect(value.maxWidth).toBeUndefined();
    expect(value.textAlign).not.toBe("right");
    // A stacked value is a second line as surely as a subtitle is.
    const s = flat(screen.getByTestId("r").props.style);
    expect(s.minHeight).toBe(Math.round(lightTheme.layout.row.minHeightTwoLine * 1.5));
  });

  it("keeps them side by side at an ordinary text size", () => {
    withTheme(lightTheme, <Row testID="r" title="Reminder Sound" value="Waheguru Soul" />);
    const value = flat(screen.getByText("Waheguru Soul").props.style);
    expect(value.textAlign).toBe("right");
    // One line, so the one-line floor — not the two-line one.
    const s = flat(screen.getByTestId("r").props.style);
    expect(s.minHeight).toBe(lightTheme.layout.row.minHeight);
  });

  it("is not focusable when it has no action", () => {
    withTheme(lightTheme, <Row testID="r" title="Version" value="1.2.3" />);
    expect(screen.getByTestId("r").props.accessibilityRole).toBeUndefined();
  });

  it("announces itself when it does have an action", () => {
    withTheme(lightTheme, <Row testID="r" title="Language" onPress={() => {}} />);
    expect(screen.getByTestId("r").props.accessibilityRole).toBe("button");
  });
});

describe("Card", () => {
  it.each(themes)("[%s] takes its surface and elevation from the theme", (_name, theme) => {
    withTheme(theme, <Card testID="c" />);
    const s = flat(screen.getByTestId("c").props.style);
    expect(s.backgroundColor).toBe(theme.c.surface);
    expect(s.height).toBeUndefined();
  });

  it("draws a real shadow in light and none in dark", () => {
    // Dark mode expresses depth by lightening the surface instead; a black
    // shadow on a near-black ground is invisible and still costs a render.
    expect(lightTheme.elevation.card.elevation).toBeGreaterThan(0);
    expect(darkTheme.elevation.card.elevation).toBe(0);
  });
});

describe("Dialog", () => {
  it("wraps its actions instead of truncating them", () => {
    withTheme(
      lightTheme,
      <Dialog
        visible
        title="Delete download"
        message={LONG_MESSAGE}
        confirmLabel={LONG_LABEL}
        cancelLabel={LONG_LABEL}
        onConfirm={() => {}}
        onCancel={() => {}}
        destructive
      />
    );
    // Both labels render in full — no ellipsis, no fixed-width button.
    expect(screen.getAllByText(LONG_LABEL)).toHaveLength(2);
    expect(screen.getByTestId("dialog-confirm")).toBeTruthy();
    expect(screen.getByTestId("dialog-cancel")).toBeTruthy();
  });

  it("omits cancel for an acknowledge-only dialog", () => {
    withTheme(
      lightTheme,
      <Dialog visible title="Done" confirmLabel="OK" onConfirm={() => {}} onCancel={() => {}} />
    );
    expect(screen.queryByTestId("dialog-cancel")).toBeNull();
  });
});

describe("ScreenHeader", () => {
  it.each(themes)("[%s] clears the camera cutout by the shared amount", (_name, theme) => {
    withTheme(theme, <ScreenHeader testID="h" title="Settings" />);
    expect(flat(screen.getByTestId("h").props.style).paddingTop).toBe(
      theme.layout.header.topClearance
    );
  });

  // Every header in the app starts its content at the same height. The Reader's
  // header reached this clearance by hand — a fixed 80pt box with bottom-aligned
  // content — while every other screen used the raw safe-area inset, a different
  // number per device that left a visible band above the title. Both now read
  // one token, so they cannot drift apart again.
  it("takes that clearance from a token, not from the device inset", () => {
    withTheme(lightTheme, <ScreenHeader testID="h" title="Settings" />);
    const padding = flat(screen.getByTestId("h").props.style).paddingTop;
    // The mocked inset is 24; the token is not, so this cannot pass by accident.
    expect(padding).not.toBe(24);
    expect(padding).toBe(lightTheme.layout.header.topClearance);
  });

  it("wraps a long title to two lines rather than shrinking it", () => {
    withTheme(lightTheme, <ScreenHeader title={LONG_LABEL} />);
    expect(screen.getByText(LONG_LABEL).props.numberOfLines).toBe(2);
    expect(screen.getByText(LONG_LABEL).props.adjustsFontSizeToFit).toBeFalsy();
  });

  it("renders no back affordance on a root screen", () => {
    withTheme(lightTheme, <ScreenHeader title="Dashboard" />);
    expect(screen.queryByTestId("screen-header-back")).toBeNull();
  });

  it("labels the back control, which is icon-only", () => {
    withTheme(
      lightTheme,
      <ScreenHeader title="About" onBack={() => {}} backAccessibilityLabel="Go back" />
    );
    const back = screen.getByTestId("screen-header-back");
    expect(back.props.accessibilityRole).toBe("button");
    expect(back.props.accessibilityLabel).toBe("Go back");
  });

  it("centres the branded variant without letting the back arrow overlap it", () => {
    withTheme(
      lightTheme,
      <ScreenHeader
        title={LONG_LABEL}
        centered
        titleVariant="baniTitle"
        onBack={() => {}}
        backAccessibilityLabel="Back"
      />
    );
    const title = screen.getByText(LONG_LABEL);
    // The folder header used to position the arrow absolutely over the title
    // and cap it at one line to compensate. Columns cannot collide, so it wraps.
    expect(title.props.numberOfLines).toBe(2);
    expect(flat(title.props.style).textAlign).toBe("center");
    expect(flat(title.props.style).fontFamily).toBe(lightTheme.type.baniTitle.fontFamily);
  });

  it("can suppress its border when the caller draws its own divider", () => {
    withTheme(lightTheme, <ScreenHeader testID="h" title="Folder" showBorder={false} />);
    expect(flat(screen.getByTestId("h").props.style).borderBottomWidth).toBe(0);
  });

  it("keeps the back target at 44pt or more on a small phone", () => {
    mockWindow = { width: 320, height: 568, scale: 2, fontScale: 1 };
    render(<ScreenHeader title="About" onBack={() => {}} backAccessibilityLabel="Back" />);
    const s = flat(screen.getByTestId("screen-header-back").props.style);
    expect(s.width).toBeGreaterThanOrEqual(44);
    expect(s.height).toBeGreaterThanOrEqual(44);
  });
});

describe("Sheet", () => {
  it("caps its height at a ratio of the screen rather than a fixed number", () => {
    withTheme(lightTheme, <Sheet visible onClose={() => {}} title="Choose" testID="s" />);
    // 844 tall reference device x the 0.9 cap.
    const panel = screen.getByText("Choose").parent;
    expect(panel).toBeTruthy();
    expect(lightTheme.layout.sheet.maxHeightRatio).toBeLessThan(1);
  });

  it("renders nothing when hidden", () => {
    withTheme(lightTheme, <Sheet visible={false} onClose={() => {}} title="Choose" />);
    expect(screen.queryByText("Choose")).toBeNull();
  });

  // A Modal is its own window, and under Android's edge-to-edge enforcement that
  // window is inset by the system bars while `useWindowDimensions` keeps
  // reporting the full display. Giving the scrim a measured height therefore
  // made it taller than the window it lived in, and `justifyContent: flex-end`
  // pushed the sheet that far BELOW the screen — the lower options could not be
  // seen or tapped, and all that was left on screen was the scrim.
  it("sizes its scrim from the window, never from a measured height", () => {
    withTheme(
      lightTheme,
      <Sheet visible onClose={() => {}} title="Choose" closeAccessibilityLabel="Close" />
    );
    // The grab bar carries the same label — it closes the sheet for a screen
    // reader too — so the scrim is the one that fills the window.
    const scrim = screen
      .getAllByLabelText("Close")
      .map((node) => flat(node.props.style))
      .find((style) => style.position === "absolute");
    expect(scrim.minHeight).toBeUndefined();
    expect(scrim.height).toBeUndefined();
    expect(scrim.position).toBe("absolute");
    expect(scrim.bottom).toBe(0);
  });

  // A sheet whose actions live under a long scrolling body puts them behind
  // all of it, and an open keyboard covers them outright. The title row is the
  // one part no keyboard reaches and nothing scrolls away.
  it("carries actions in the title's own row", () => {
    withTheme(
      lightTheme,
      <Sheet visible onClose={() => {}} title="Morning Nitnem" actions={<Text>Save</Text>}>
        <Text>Rows</Text>
      </Sheet>
    );
    const body = screen.UNSAFE_getByType(ScrollView);

    expect(screen.getByText("Morning Nitnem")).toBeTruthy();
    expect(screen.getByText("Save")).toBeTruthy();
    // Outside the scroller is the whole point — inside it they scroll away.
    expect(within(body).queryByText("Save")).toBeNull();
  });

  it("lets a long title take the width the actions leave, and wrap into it", () => {
    // Neither clipped nor running under the icons: the title flexes, the
    // actions do not, so a long pothi name grows the row instead.
    withTheme(
      lightTheme,
      <Sheet
        visible
        onClose={() => {}}
        title="A very long pothi name indeed"
        actions={<Text>Save</Text>}
      >
        <Text>Rows</Text>
      </Sheet>
    );
    const title = flat(screen.getByText("A very long pothi name indeed").props.style);

    expect(title.flexShrink).toBe(1);
    expect(title.numberOfLines).toBeUndefined();
  });

  it("declares both translucency flags so its window spans the display", () => {
    withTheme(lightTheme, <Sheet visible onClose={() => {}} title="Choose" testID="s" />);
    const modal = screen.getByTestId("s");
    // RN warns if the navigation flag is set without the status bar one.
    expect(modal.props.statusBarTranslucent).toBe(true);
    expect(modal.props.navigationBarTranslucent).toBe(true);
  });
});

describe("Toast", () => {
  it.each(themes)("[%s] never truncates the message", (_name, theme) => {
    withTheme(theme, <Toast testID="t" type="error" message={LONG_MESSAGE} />);
    const message = screen.getByText(LONG_MESSAGE);
    // No numberOfLines means it wraps to whatever the translation needs.
    expect(message.props.numberOfLines).toBeUndefined();
  });

  it("has no fixed width, only a cap", () => {
    withTheme(lightTheme, <Toast testID="t" message="Saved" />);
    const s = flat(screen.getByTestId("t").props.style);
    expect(s.width).toBe("100%");
    expect(s.maxWidth).toBe(lightTheme.layout.dialog.maxWidth);
  });

  it("does not rely on colour alone to convey status", () => {
    withTheme(lightTheme, <Toast testID="t" type="error" message="Download failed" />);
    // The dot is decorative; the message itself states the outcome.
    expect(screen.getByText("Download failed")).toBeTruthy();
  });
});

// A row's padding is the one that makes a Settings row as thick as a bani row on
// the home screen. Both read the same token precisely so they cannot drift.
describe("row thickness", () => {
  it("pads a row by the same step the bani list uses", () => {
    expect(lightTheme.layout.row.paddingVertical).toBe(lightTheme.space.lg);
  });
});

// A header title is centred by the two side slots being EQUAL — the middle
// column is flexible, so it fills whatever they leave. Seva has a close cross
// and no back button; with only one slot its title sat left of centre. Pinning
// the trailing slot to the leading slot's width then clipped Reminder Options,
// which carries TWO actions, off the screen edge. The trailing slot therefore
// sizes to its content and the leading spacer mirrors its measured width.
describe("ScreenHeader title centring", () => {
  const trailingSlotOf = () => screen.getByTestId("screen-header-actions");

  it("mirrors the trailing slot width on the leading side", () => {
    withTheme(
      lightTheme,
      <ScreenHeader testID="h" title="Seva" actions={<Text testID="act">x</Text>} />
    );

    act(() => trailingSlotOf().props.onLayout({ nativeEvent: { layout: { width: 72 } } }));

    const widths = [];
    const walk = (node) => {
      if (!node || typeof node !== "object") return;
      const st = flat(node.props?.style);
      if (st && st.width === 72) widths.push(72);
      (node.children ?? []).forEach(walk);
    };
    walk(screen.toJSON());
    expect(widths.length).toBeGreaterThanOrEqual(1);
  });

  it("never pins the trailing slot to a fixed width, so actions cannot clip", () => {
    withTheme(
      lightTheme,
      <ScreenHeader
        testID="h"
        title="Reminders"
        onBack={() => {}}
        actions={<Text testID="act">xx</Text>}
      />
    );
    expect(flat(trailingSlotOf().props.style).width).toBeUndefined();
  });

  it("adds no leading spacer when there is a back button already", () => {
    withTheme(lightTheme, <ScreenHeader testID="h" title="Settings" onBack={() => {}} />);
    expect(screen.getByTestId("screen-header-back")).toBeTruthy();
  });
});
