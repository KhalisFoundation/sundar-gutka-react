import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import PropTypes from "prop-types";
import useBaniTitle from "@common/hooks/useBaniTitle";
import useTokens from "@common/hooks/useTokens";
import { CloseIcon } from "@common/icons";
import { STRINGS } from "@common";
import { Text } from "../../common/components/ui";

// One shabad inside an expanded pothi.
//
// Reads as a bani row, because that is what it is: the same `body` size, the
// same `space.lg` rhythm and the same inset hairline as the list above it, just
// indented so it lines up under the pothi's name. It previously sat on a tinted
// ground at caption size with a bullet, which made the contents look like a
// different component wedged into the list.
//
// The title goes through `useBaniTitle`, the same hook the main bani list uses,
// so an expanded pothi shows its shabads exactly as the list behind it does.
// This carried its own copy of the rule that had no transliteration branch, so
// with transliteration on the list read Latin while the pothi under it stayed
// in Gurmukhi.
const PothiShabadRow = ({ bani, onPress, onRemove = null, showSeparator = true }) => {
  const { c, space, layout } = useTokens();
  const { titleFor, titleFontFamily } = useBaniTitle();

  const title = titleFor(bani);

  // Lines the children up under the pothi's NAME, not under its folder glyph.
  const indent = layout.screenGutter + space.xl;

  return (
    <View>
      {showSeparator && (
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: c.border,
            marginLeft: indent,
            marginRight: layout.screenGutter,
          }}
        />
      )}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={title}
          style={({ pressed }) => ({
            flex: 1,
            justifyContent: "center",
            paddingLeft: indent,
            paddingRight: space.md,
            paddingVertical: space.lg,
            minHeight: layout.row.minHeight,
            backgroundColor: pressed ? c.surfaceSelected : "transparent",
          })}
        >
          <Text variant="body" numberOfLines={2} style={{ fontFamily: titleFontFamily }}>
            {title}
          </Text>
        </Pressable>

        {onRemove && (
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={STRINGS.POTHI_REMOVE_BANI}
            hitSlop={layout.hitSlop}
            style={{
              minWidth: layout.touchTarget,
              minHeight: layout.touchTarget,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CloseIcon size={16} color={c.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

PothiShabadRow.propTypes = {
  bani: PropTypes.shape({
    id: PropTypes.number,
    gurmukhi: PropTypes.string,
    gurmukhiUni: PropTypes.string,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
  /** Omitted for a bundled folder's children, which cannot be removed. */
  onRemove: PropTypes.func,
  /** False for the first child — the pothi row above already ends in a rule. */
  showSeparator: PropTypes.bool,
};

export default PothiShabadRow;
