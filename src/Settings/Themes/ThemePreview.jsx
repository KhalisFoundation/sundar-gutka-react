import React from "react";
import { View, ImageBackground, StyleSheet, Text as RNText } from "react-native";
import { readerThemeShape } from "@theme/reader";
import { constant } from "@common";

// A miniature of the reading surface, rendered from a theme record and nothing
// else. Deliberately not a shipped thumbnail image:
//   • no @1x/@2x/@3x matrix, so iOS and Android cannot drift apart;
//   • crisp at every density, because it is text and views rather than a bitmap;
//   • a new theme produces its own preview with no extra work, which is the
//     "thumbnails are config-driven" requirement met by construction;
//   • the preview cannot fall out of sync with the theme it is showing.
//
// This IS the preview — tapping a tile applies the theme, so there is no
// second, larger rendering to keep in step with this one.

// Ik Onkar and the opening of the Mool Mantar — real Gurbani, so the tile shows
// what the theme actually does to the text people read.
//
// The Ik Onkar is the "<>" ligature of the Gurbani face, the same glyph the
// home screen's invocation line draws: it is the one rendering with the full
// elongated stroke over the onkar. The Unicode ੴ decomposes in that face and
// flattens in Baloo, so the tile would otherwise show a different symbol from
// the screen it sits two taps away from.
const SAMPLE = {
  heading: "<>",
  gurbani: "ਸਤਿ ਨਾਮੁ ਕਰਤਾ ਪੁਰਖੁ",
  transliteration: "sat naam kartaa purakh",
  translation: "One Universal Creator, Truth is the Name",
};

// React Native supports only these three, so anything else falls back to solid
// rather than silently dropping the frame.
const RN_BORDER_STYLES = ["solid", "dotted", "dashed"];

// React Native's Image decodes raster formats only. An SVG data URI — which is
// what the WebView happily renders for the paper grain — fails to load and would
// leave an empty layer, so it is detected and the tile falls back to the theme's
// flat ground. The colour, type and frame are all still true, which is what a
// thumbnail is judged on; the grain appears in the Reader, where it belongs. A
// require()d raster asset (a number) or a raster URL renders normally.
const isRenderableInRN = (image) => {
  if (!image) return false;
  if (typeof image === "number") return true;
  return typeof image === "string" && !image.startsWith("data:image/svg+xml");
};

const toImageSource = (image) => (typeof image === "number" ? image : { uri: image });
const rnBorderStyle = (style) => (RN_BORDER_STYLES.includes(style) ? style : "solid");

// The sample is rendered with React Native's own Text, NOT the app's CustomText
// or ui/Text — the one place in the app that should bypass them.
//
// Those force `allowFontScaling` on (capped at 1.5x), which is right for every
// real label and wrong here: this is a PICTURE of a page, the same way a
// screenshot is. At a 1.5x system font the sample outgrows the tile and
// truncates, and the thumbnail stops representing the theme it is advertising.
// Scaling a preview of text is like scaling a preview of a photograph.
//
// Nothing is lost for accessibility: the sample is decorative and hidden from
// screen readers (see `body` below), and the tile's real accessible name is the
// theme's NAME, rendered by ThemeTile in CustomText, which does scale.

// Tile-sized type, fixed for the reason above.
const GURBANI_SIZE = 14;
const META_SIZE = 8.5;
// A rule reads heavy at thumbnail scale, so it is drawn lighter than life.
const RULE_SCALE = 0.6;
// A frame's inset is designed against a full screen. On a tile roughly a fifth
// that wide the same number sits a third of the way in, so the geometry is
// scaled with the tile — otherwise Puratan's frame swallows the sample.
const FRAME_SCALE = 0.5;
// Breathing room between the innermost rule and the text, mirroring the +10 the
// Reader's own gutter uses so glyphs never kiss the line.
const FRAME_GUTTER = 5;
// Padding when there is no frame at all.
const BARE_PADDING = 10;

const styles = StyleSheet.create({
  surface: { flex: 1, overflow: "hidden" },
  stack: { flex: 1, justifyContent: "center", paddingVertical: 10 },
  centered: { textAlign: "center" },
});

/**
 * The frame's geometry at TILE scale, and the text gutter that clears it.
 *
 * Extracted so the "text never overlaps the rules" invariant can be asserted
 * without measuring a rendered layout — it is the same rule the Reader's own
 * borderCss holds, and it was broken here first.
 */
const frameGeometry = (border) => {
  const gap = border.gap ?? 0;
  const outerWidth = border.outerWidth ?? border.width;
  const inset = border.inset * FRAME_SCALE;
  const innermost = gap > 0 ? inset + (outerWidth + gap) * FRAME_SCALE : inset;
  const ruleWidth = Math.max(1, Math.round(border.width * RULE_SCALE));
  return {
    gap,
    outerWidth,
    inset,
    innermost,
    ruleWidth,
    gutter:
      border.width > 0
        ? Math.max(BARE_PADDING, innermost + ruleWidth + FRAME_GUTTER)
        : BARE_PADDING,
  };
};

const ThemePreview = ({ theme }) => {
  const { border, background, text, typography } = theme;

  // One absolutely-positioned View per rule. A theme with `border.gap` draws two
  // concentric rules, matching what the Reader renders — a single line here
  // would misrepresent a frame the user is about to see as two, and each rule
  // takes its OWN colour and weight so the tile cannot lie about either.
  const ruleAt = ({ distance, width, color }) => ({
    position: "absolute",
    top: distance,
    left: distance,
    right: distance,
    bottom: distance,
    borderWidth: Math.max(1, Math.round(width * RULE_SCALE)),
    borderColor: color,
    borderStyle: rnBorderStyle(border.style),
    borderRadius: border.radius,
  });

  // Geometry and the text gutter both come from the frame — never a flat
  // number. A fixed 12px let the sample run straight over Puratan's rules,
  // which sit further in than that.
  const { gap, outerWidth, inset, innermost, gutter } = frameGeometry(border);

  // Outer rule first (further out), then the inner rule the sample sits in —
  // the same order gutkahtml paints them in.
  const rules =
    border.width > 0
      ? [
          ...(gap > 0
            ? [{ distance: inset, width: outerWidth, color: border.outerColor ?? border.color }]
            : []),
          { distance: innermost, width: border.width, color: border.color },
        ]
      : [];

  const lineRatio = typography.lineHeightRatio ?? 1.5;
  const gurbaniSize = GURBANI_SIZE * (typography.fontScale || 1);
  // The Ik Onkar carries marks well above and below the baseline. Its line box
  // gets the same generous ratio as the body rather than a tight one, or Android
  // clips the upper stroke — the same reason the Reader's header title pins no
  // lineHeight at all.
  const headingSize = gurbaniSize * 1.35;

  // Decorative: the tile's accessible name is the theme's name, which
  // ThemeTile renders separately. A screen reader announcing four lines of
  // sample Gurbani per tile would be noise.
  const body = (
    <View
      style={[styles.stack, { paddingHorizontal: gutter }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {rules.map((rule) => (
        <View key={rule.distance} style={ruleAt(rule)} pointerEvents="none" />
      ))}
      <RNText
        allowFontScaling={false}
        style={[
          styles.centered,
          {
            fontSize: headingSize,
            lineHeight: headingSize * 1.5,
            includeFontPadding: false,
            color: text.gurbaniHeading.color,
            fontFamily: constant.GURBANI_AKHAR_TRUE,
          },
        ]}
      >
        {SAMPLE.heading}
      </RNText>
      <RNText
        allowFontScaling={false}
        numberOfLines={2}
        style={[
          styles.centered,
          {
            fontSize: gurbaniSize,
            lineHeight: gurbaniSize * lineRatio,
            includeFontPadding: false,
            color: text.gurbani.color,
            fontFamily: constant.GURBANI_AKHAR_TRUE,
          },
        ]}
      >
        {SAMPLE.gurbani}
      </RNText>
      <RNText
        allowFontScaling={false}
        numberOfLines={1}
        style={[
          styles.centered,
          {
            fontSize: META_SIZE,
            lineHeight: META_SIZE * 1.45,
            includeFontPadding: false,
            color: text.transliteration.color,
            fontFamily: constant.BALOO_PAAJI,
          },
        ]}
      >
        {SAMPLE.transliteration}
      </RNText>
      <RNText
        allowFontScaling={false}
        numberOfLines={2}
        style={[
          styles.centered,
          {
            fontSize: META_SIZE,
            lineHeight: META_SIZE * 1.45,
            includeFontPadding: false,
            color: text.translation.color,
            fontFamily: constant.BALOO_PAAJI,
          },
        ]}
      >
        {SAMPLE.translation}
      </RNText>
    </View>
  );

  // A texture theme layers the image over its ground at the theme's own opacity,
  // mirroring how gutkahtml paints it in the WebView.
  if (isRenderableInRN(background.image)) {
    return (
      <View style={[styles.surface, { backgroundColor: background.color }]}>
        <ImageBackground
          source={toImageSource(background.image)}
          resizeMode={background.imageRepeat === "repeat" ? "repeat" : "cover"}
          imageStyle={{ opacity: background.imageOpacity }}
          style={StyleSheet.absoluteFill}
        />
        {body}
      </View>
    );
  }

  return <View style={[styles.surface, { backgroundColor: background.color }]}>{body}</View>;
};

ThemePreview.propTypes = {
  theme: readerThemeShape.isRequired,
};

export { SAMPLE, isRenderableInRN, frameGeometry };
export default ThemePreview;
