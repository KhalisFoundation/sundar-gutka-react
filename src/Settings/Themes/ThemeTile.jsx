import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { readerThemeShape } from "@theme/reader";
import PropTypes from "prop-types";
import useTokens from "@common/hooks/useTokens";
import { CustomText, STRINGS } from "@common";
import ThemePreview from "./ThemePreview";

const styles = StyleSheet.create({
  // 3:4 via aspectRatio, which resolves identically on both platforms and
  // avoids deriving a height from a measured width.
  card: { aspectRatio: 3 / 4, overflow: "hidden" },
  // The selection ring is drawn as a BORDER on this outer view, never as a
  // shadow: Android `elevation` and iOS `shadow*` render differently and the
  // two platforms would disagree about what "selected" looks like.
  //
  // The border is always present and only changes colour, so selecting a tile
  // never changes its size — a transparent-to-2px swap would make the whole
  // grid reflow on every tap.
  ring: { borderWidth: 2, overflow: "hidden" },
  // Size comes from the caller — it grows with the OS text setting, because the
  // tick inside it does. A fixed 22pt box clipped the glyph at a large font.
  check: {
    position: "absolute",
    top: 6,
    end: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { marginTop: 6, textAlign: "center" },
});

/**
 * One selectable theme in the grid: a live miniature of the reading surface with
 * its name underneath.
 *
 * `previewNode` overrides the rendered preview, for "Follow app appearance"
 * which is not a theme record and shows a split of light and dark instead.
 */
const ThemeTile = ({ label, selected, onPress, theme = undefined, previewNode = undefined }) => {
  const { c, radii, scale } = useTokens();
  // The tick and the badge around it grow together with the OS text size, so
  // the glyph is never clipped by its own chip.
  const checkFont = 13;
  const checkSize = Math.round(checkFont * 1.7 * scale.container);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      // The name alone would be announced as just "Light"; this says what
      // choosing it does.
      accessibilityLabel={`${label} — ${STRINGS.theme}`}
      accessibilityHint={selected ? STRINGS.theme_selected : undefined}
    >
      <View
        style={[
          styles.card,
          styles.ring,
          {
            borderRadius: radii.md,
            borderColor: selected ? c.accent : c.border,
            backgroundColor: c.surface,
          },
        ]}
      >
        {previewNode ?? <ThemePreview theme={theme} />}
        {selected ? (
          <View
            style={[
              styles.check,
              {
                backgroundColor: c.accent,
                width: checkSize,
                height: checkSize,
                borderRadius: checkSize / 2,
              },
            ]}
          >
            <CustomText style={{ color: c.onPrimary, fontSize: checkFont }}>✓</CustomText>
          </View>
        ) : null}
      </View>
      {/* No numberOfLines and no adjustsFontSizeToFit: a translated theme name
          may run three to four times the English, and it must wrap and grow the
          row rather than shrink to a different size in every cell. */}
      <CustomText style={[styles.label, { color: selected ? c.textBrand : c.textPrimary }]}>
        {label}
      </CustomText>
    </Pressable>
  );
};

ThemeTile.propTypes = {
  label: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  onPress: PropTypes.func.isRequired,
  theme: readerThemeShape,
  previewNode: PropTypes.node,
};

export default ThemeTile;
