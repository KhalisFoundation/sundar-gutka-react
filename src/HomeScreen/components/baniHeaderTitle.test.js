import fs from "fs";
import path from "path";
import { StyleSheet } from "react-native";
import createStyles from "../styles";

// The app name in the home header wraps to two lines on an ordinary phone —
// "ਸੁੰਦਰ ਗੁਟਕਾ" needs about 194dp at 32pt and the middle column offers ~180dp
// once the two 48dp side slots and the two ornaments are taken out. Wrapping is
// therefore the normal case, not the edge case, and the two things that make it
// work are easy to undo by accident:
//
//   1. The SHRINK lives on the wrapping View, not on the Text. A Text carrying
//      flexShrink inside a row is measured for height at its unshrunk width —
//      one line — and keeps that height after the width narrows, so the second
//      line is laid out past the bottom of its own box and clipped. That is the
//      bug this file exists for: the header read "ਸੁੰਦਰ" with no "ਗੁਟਕਾ".
//
//   2. There is NO explicit lineHeight anywhere on this Text. React Native
//      cuts a Text off on Android when it carries one inside a row layout
//      (facebook/react-native#53286), and this Text sits in a row — that is
//      the second way the header loses "ਗੁਟਕਾ". The font's own line spacing
//      scales with fontSize, so nothing is lost by leaving it unset.

const flat = (s) => StyleSheet.flatten(s) ?? {};

const theme = {
  mode: "light",
  spacing: { sm: 8 },
  typography: {
    sizes: { huge: 28 },
    fonts: { balooPaaji: "BalooPaaji2-Regular", balooPaajiSemiBold: "SemiBold" },
  },
  c: { headerFg: "#123456", textSecondary: "#777777" },
};

describe("the home header title", () => {
  const styles = createStyles(theme);

  it("puts the shrink on the wrapper, so a wrapped line is not clipped", () => {
    expect(flat(styles.titleNameWrap).flexShrink).toBe(1);
  });

  it("does not put flexShrink back on the Text itself", () => {
    expect(flat(styles.newHeaderTitleText).flexShrink).toBeUndefined();
  });

  it("sets no lineHeight in the stylesheet", () => {
    expect(flat(styles.newHeaderTitleText).lineHeight).toBeUndefined();
  });

  // The stylesheet check alone would miss one handed in through the style
  // array, which is exactly how it was passed before RN#53286 was traced.
  it("does not let the component hand one in either", () => {
    const src = fs.readFileSync(path.join(__dirname, "BaniHeader.jsx"), "utf8");
    const titleBlock = src.slice(src.indexOf("titleNameWrap"), src.indexOf("settingsWrap"));
    expect(titleBlock).not.toMatch(/lineHeight:/);
  });

  it("never caps the name to one line — wrapping is the whole point", () => {
    const src = fs.readFileSync(path.join(__dirname, "BaniHeader.jsx"), "utf8");
    const titleBlock = src.slice(src.indexOf("titleNameWrap"), src.indexOf("settingsWrap"));
    expect(titleBlock).not.toMatch(/numberOfLines/);
    expect(titleBlock).not.toMatch(/ellipsizeMode/);
  });

  it("keeps the ornaments rigid so the name is what gives way", () => {
    expect(flat(styles.titleFlower).flexShrink).toBe(0);
  });

  it("reserves matching side slots so the gear and the title cannot overlap", () => {
    expect(flat(styles.titleSpacer).width).toBe(flat(styles.settingsWrap).width);
  });

  it("centres the row, so the ornaments sit level with a two-line name", () => {
    expect(flat(styles.titleCenter).alignItems).toBe("center");
    expect(flat(styles.titleCenter).flexDirection).toBe("row");
  });
});
