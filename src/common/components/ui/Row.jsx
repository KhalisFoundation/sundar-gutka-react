import React from "react";
import { Pressable, View } from "react-native";
import PropTypes from "prop-types";
import useTokens from "../../hooks/useTokens";
import Text from "./Text";

// A list row: the shape Settings, Seva and the bani lists all reimplement
// slightly differently today.
//
// The whole point of this component is the locale rule. A row is
// [leading icon] [title / subtitle] [value] [trailing control]. The middle
// column is the only part that GROWS; the icon and the trailing control keep
// their intrinsic size. That is what stops a long Punjabi label from pushing a
// chevron off the screen — the failure mode that `adjustsFontSizeToFit` was
// being used to paper over, which instead left every row's label at a
// different size.
//
// ── How the title and its value divide the line ────────────────────────────
// The title column starts from its OWN width and shrinks, rather than starting
// from zero and living on what is left over. See the note at the column
// itself: getting that wrong is what wrapped "Reminder Sound" one character
// per line while "Waheguru Soul" sat beside it on a single line.
//
// Past a certain OS text size no division of one line works, so the value
// drops UNDER the title and takes the full width — the same thing both
// platforms' own Settings do at accessibility text sizes.
//
// `minHeight` scales with the OS font setting and never becomes a fixed height,
// so a two-line title in `hi` simply makes the row taller.

/**
 * The OS text scale past which the title and its value stop sharing a line.
 * Below it there is room to divide; above it both halves would be squeezed to
 * a couple of characters each however the space is split.
 */
const STACK_ABOVE_FONT_SCALE = 1.3;
/**
 * The same, sooner, on a narrow screen. Android's display-size setting cuts the
 * width in dp while the text-size setting grows the text, so the two compound
 * and the row runs out of room before the text scale alone would say so.
 */
const STACK_ABOVE_FONT_SCALE_COMPACT = 1.15;
/** The most of a row a value may claim while it still shares the line. */
const VALUE_MAX_WIDTH = "45%";

const Row = ({
  title,
  subtitle = undefined,
  leading = null,
  trailing = null,
  value = undefined,
  onPress = undefined,
  disabled = false,
  accessibilityRole = undefined,
  accessibilityLabel = undefined,
  accessibilityHint = undefined,
  accessibilityState = undefined,
  showDivider = false,
  testID = undefined,
  style = undefined,
  titleStyle = undefined,
}) => {
  const { c, space, layout, scale } = useTokens();
  const interactive = Boolean(onPress);
  const stacked =
    scale.fontScale >=
    (scale.breakpoint === "compact" ? STACK_ABOVE_FONT_SCALE_COMPACT : STACK_ABOVE_FONT_SCALE);

  // One element, placed in one of two positions — beside the title or beneath
  // it. Written once so the two layouts cannot say different things.
  const valueText = value ? (
    <Text
      variant="bodySmall"
      color="textSecondary"
      align={stacked ? undefined : "right"}
      // Stacked it owns the full width, so it needs neither a cap nor the
      // ability to shrink.
      style={stacked ? undefined : { flexShrink: 1, maxWidth: VALUE_MAX_WIDTH }}
    >
      {value}
    </Text>
  ) : null;

  const content = (
    <>
      {leading ? <View style={{ width: layout.row.iconSize }}>{leading}</View> : null}

      {/* The flexible column — and `flexBasis: "auto"`, NOT `flex: 1`.
          `flex: 1` means `flexBasis: 0%`: it tells Yoga this column begins at
          zero width and lives on whatever is left over. So the value, which
          carries its own intrinsic width, was served FIRST and took as much as
          it wanted; the title got the remainder. At a raised OS text size the
          remainder is a few points, which is why the title wrapped one or two
          characters per line — or vanished entirely — beside a value sitting
          comfortably on one line. `flexShrink` on the value could not help:
          shrinking only begins once the children OVERFLOW, and with the title
          contributing nothing they never did.

          Starting each from its own width means the two shrink in proportion
          when they cannot both fit, and each wraps like ordinary text. */}
      <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: "auto", gap: space.xxs }}>
        <Text variant="body" color={disabled ? "textDisabled" : "textPrimary"} style={titleStyle}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" color="textSecondary">
            {subtitle}
          </Text>
        ) : null}
        {stacked ? valueText : null}
      </View>

      {stacked ? null : valueText}

      {trailing ?? null}
    </>
  );

  const rowStyle = [
    {
      flexDirection: "row",
      alignItems: "center",
      gap: space.md,
      // A stacked value is a second line as surely as a subtitle is, so it
      // takes the two-line floor rather than the one-line one.
      minHeight:
        subtitle || (stacked && value) ? layout.row.minHeightTwoLine : layout.row.minHeight,
      paddingHorizontal: layout.row.paddingHorizontal,
      paddingVertical: layout.row.paddingVertical,
      borderBottomWidth: showDivider ? layout.borderWidth.hairline : 0,
      borderBottomColor: c.border,
    },
    style,
  ];

  if (!interactive) {
    return (
      <View style={rowStyle} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole={accessibilityRole ?? "button"}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, ...accessibilityState }}
      style={({ pressed }) => [
        ...rowStyle,
        pressed ? { backgroundColor: c.surfaceSelected } : null,
      ]}
    >
      {content}
    </Pressable>
  );
};

Row.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  /** Leading icon. Sized by the caller; the row reserves `row.iconSize`. */
  leading: PropTypes.node,
  /** Trailing control — a switch, a chevron, a checkmark. */
  trailing: PropTypes.node,
  /** Current setting shown on the right, e.g. the selected language. */
  value: PropTypes.string,
  onPress: PropTypes.func,
  disabled: PropTypes.bool,
  accessibilityRole: PropTypes.string,
  accessibilityLabel: PropTypes.string,
  accessibilityHint: PropTypes.string,
  accessibilityState: PropTypes.shape({
    checked: PropTypes.bool,
    selected: PropTypes.bool,
    expanded: PropTypes.bool,
    busy: PropTypes.bool,
  }),
  showDivider: PropTypes.bool,
  testID: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  /** Overrides the title font — e.g. Gurmukhi, which needs its own face. */
  titleStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

export default Row;
