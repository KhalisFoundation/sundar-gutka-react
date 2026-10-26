import fs from "fs";
import path from "path";

// The auto-scroll speed dot must be the SAME white as the play/pause icons and
// the filled part of the track.
//
// It was blackish grey, and the reason is a trap in the slider library rather
// than a wrong colour. `@miblanchard/react-native-slider` renders its thumb as:
//
//     { backgroundColor: thumbTintColor, ...thumbStyle }
//
// Spreading an ARRAY into an object yields { 0: …, 1: … }, so passing
// `thumbStyle={[styles.thumb, { backgroundColor: white }]}` drops the colour
// silently and the library's default `#343434` wins. Nothing errors, and the
// style looks correct at the call site — which is why it survived two attempts
// at "fixing the colour".
//
// Asserted against the source because rendering the third-party slider under
// jest would only re-test the library, not our call.

const source = fs.readFileSync(path.join(__dirname, "autoScrollComponent.jsx"), "utf8");

describe("auto-scroll speed thumb", () => {
  it("sets the colour through thumbTintColor, the prop the library reads", () => {
    expect(source).toMatch(/thumbTintColor=\{textColor\}/);
  });

  it("never passes an array as thumbStyle, which would drop the style", () => {
    expect(source).not.toMatch(/thumbStyle=\{\[/);
  });

  it("uses one value for the thumb, the filled track and the icons", () => {
    // textColor is the single source for all three.
    expect(source).toMatch(/const textColor = theme\.c\.onPrimary;/);
    expect(source).toMatch(/minimumTrackTintColor=\{textColor\}/);
    expect(source).toMatch(/color=\{textColor\}/);
  });

  it("leaves no shadow on the dot to darken its edges", () => {
    const thumbBlock = source.slice(
      source.indexOf("sliderThumb: {"),
      source.indexOf("currentValueText:")
    );
    expect(thumbBlock).not.toMatch(/shadowOpacity|elevation:/);
  });
});
