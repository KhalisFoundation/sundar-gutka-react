import React from "react";
import { View, StyleSheet } from "react-native";
import { READER_THEMES_BY_ID } from "@theme/reader";
import ThemePreview from "./ThemePreview";

const styles = StyleSheet.create({
  surface: { flex: 1, overflow: "hidden" },
  // The right half of the tile, clipping the dark preview.
  darkHalf: {
    position: "absolute",
    top: 0,
    bottom: 0,
    // `end`, not `right`, so the split flips with the layout direction — the app
    // ships Shahmukhi, which reads right to left.
    end: 0,
    width: "50%",
    overflow: "hidden",
  },
  // Inside that clip, a FULL-tile-width preview anchored to the same edge. This
  // is what makes the seam work: both previews lay their text out at the tile's
  // real width, so the two halves line up exactly and the Ik Onkar is split down
  // the middle rather than being drawn twice at half scale.
  darkInner: { position: "absolute", top: 0, bottom: 0, end: 0, width: "200%" },
});

// "System default" follows the device, so it has no single appearance to show.
// The tile shows BOTH — light on the leading half, dark on the trailing half,
// one continuous page split down the middle — which says what the option does
// far more directly than a label could.
const SystemThemePreview = () => (
  <View style={styles.surface}>
    <ThemePreview theme={READER_THEMES_BY_ID.light} />
    <View style={styles.darkHalf} pointerEvents="none">
      <View style={styles.darkInner}>
        <ThemePreview theme={READER_THEMES_BY_ID.dark} />
      </View>
    </View>
  </View>
);

export default SystemThemePreview;
