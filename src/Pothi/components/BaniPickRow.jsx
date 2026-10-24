import React from "react";
import { Pressable, View } from "react-native";
import PropTypes from "prop-types";
import useTokens from "@common/hooks/useTokens";
import { Text } from "../../common/components/ui";

// One tickable bani. Used by `PickBanisStep`, which is the app's only bani
// multi-select, and by the folder screen's delete-selection mode — the two
// places a bani is ticked rather than opened.
const BaniPickRow = ({ title, checked, onPress, fontFamily = null }) => {
  const { c, space, radii, layout } = useTokens();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={title}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        minHeight: layout.row.minHeight,
        paddingVertical: space.md_12,
        paddingHorizontal: space.sm,
        backgroundColor: pressed ? c.surfaceSelected : "transparent",
      })}
    >
      {/* A box, not colour alone — the ticked state has to be visible to
          anyone who cannot separate the two hues. */}
      <View
        style={{
          width: layout.checkbox,
          height: layout.checkbox,
          borderRadius: radii.sm,
          borderWidth: layout.borderWidth.hairline,
          borderColor: checked ? c.accent : c.borderStrong,
          backgroundColor: checked ? c.accent : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && (
          <Text variant="caption" color="onPrimary">
            ✓
          </Text>
        )}
      </View>
      {/* The face comes from useBaniTitle with the string: Gurmukhi needs the
          bani font, transliterated Latin must not get it. */}
      <Text variant="body" numberOfLines={2} style={{ flex: 1, fontFamily }}>
        {title}
      </Text>
    </Pressable>
  );
};

BaniPickRow.propTypes = {
  title: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onPress: PropTypes.func.isRequired,
  /** From `useBaniTitle().titleFontFamily`; null under transliteration. */
  fontFamily: PropTypes.string,
};

export default BaniPickRow;
