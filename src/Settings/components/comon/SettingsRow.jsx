import React from "react";
import { Image, View } from "react-native";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import ThemedSwitch from "@common/components/ThemedSwitch";
import useTokens from "@common/hooks/useTokens";
import { ChevronRight } from "@common/icons";
import { Row, Text } from "../../../common/components/ui";

// One row for the whole Settings screen.
//
// It replaces three separate shapes that had drifted apart:
//   • `ListItemComponent`  — icon + title + value + chevron (opens a sheet)
//   • `ListItemWithIcon`   — icon + title + chevron (navigates)
//   • eight hand-rolled toggle rows, each with its own @rneui `ListItem`
//
// Built on the shared `Row`, so height, padding, divider and press state come
// from the same place as every other list in the app.
//
// ── The value column ───────────────────────────────────────────────────────
// The old row rendered its trailing value with `adjustsFontSizeToFit` and
// `minimumFontScale={0.65}`. That sizes each value independently by its own
// string length, so a column of them rendered at a dozen different sizes —
// which reads as broken, and is worst in `hi`/`pa` where the values are
// longest. Here the value keeps one size and wraps to a second line if it must;
// the row grows to fit rather than the text shrinking to hide.

const SettingsRow = ({
  title,
  subtitle = undefined,
  value = undefined,
  icon = undefined,
  iconImage = undefined,
  IconComponent = undefined,
  tintIcon = true,
  onPress = undefined,
  trailing = undefined,
  accessibilityHint = undefined,
  showChevron = true,
  disabled = false,
  destructive = false,
  testID = undefined,
}) => {
  const { c, layout } = useTokens();
  // Destructive rows carry the error role on the title AND the icon. Colouring
  // only one of them reads as a mistake rather than a warning — and the icon is
  // the half the eye reaches first down a column of rows.
  const iconColor = destructive ? c.error : c.textSecondary;

  const leading = (() => {
    // An SVG from `common/icons`, taking size and colour from the same tokens
    // the vector-name and PNG branches below do. Preferred over `iconImage`:
    // a PNG cannot follow the theme.
    if (IconComponent) {
      return <IconComponent size={layout.row.iconSize} color={iconColor} />;
    }
    if (iconImage) {
      return (
        <Image
          source={iconImage}
          style={{
            width: layout.row.iconSize,
            height: layout.row.iconSize,
            resizeMode: "contain",
            // Monochrome PNGs are recoloured to match the vector icons. Icons
            // whose own colours carry meaning (the theme swatch) opt out.
            ...(tintIcon ? { tintColor: c.textSecondary } : {}),
          }}
          accessibilityIgnoresInvertColors
        />
      );
    }
    if (icon) {
      return <Icon name={icon} color={iconColor} size={layout.row.iconSize} />;
    }
    return null;
  })();

  // A row either navigates (chevron) or carries a control; never both.
  const chevron =
    onPress && showChevron ? <ChevronRight size={layout.icon.sm} color={c.textSecondary} /> : null;
  const trailingNode = trailing ?? chevron;

  return (
    <Row
      title={title}
      titleStyle={destructive ? { color: c.error } : undefined}
      subtitle={subtitle}
      leading={leading}
      trailing={trailingNode}
      value={value}
      onPress={onPress}
      disabled={disabled}
      showDivider
      accessibilityHint={accessibilityHint}
      testID={testID}
    />
  );
};

SettingsRow.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  /** Paints the title and icon with the error role — for rows that destroy. */
  destructive: PropTypes.bool,
  /** The current selection, shown on the right. */
  value: PropTypes.string,
  /** A vector icon name (@rneui material set). */
  icon: PropTypes.string,
  /** A bundled PNG. Takes precedence over `icon`. */
  iconImage: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  /** An SVG icon component taking `size` and `color`. Takes precedence over both. */
  IconComponent: PropTypes.elementType,
  tintIcon: PropTypes.bool,
  onPress: PropTypes.func,
  /** A switch or other control. Replaces the chevron. */
  trailing: PropTypes.node,
  accessibilityHint: PropTypes.string,
  showChevron: PropTypes.bool,
  disabled: PropTypes.bool,
  testID: PropTypes.string,
};

/**
 * A setting that is on or off. The whole row is the target, not just the
 * switch — a 50pt switch at the far edge of the screen is a small thing to hit,
 * and every platform's own settings let you tap the row.
 */
export const SettingsToggleRow = ({
  title,
  subtitle = undefined,
  value,
  onValueChange,
  icon = undefined,
  iconImage = undefined,
  tintIcon = true,
  disabled = false,
  testID = undefined,
}) => (
  <SettingsRow
    title={title}
    subtitle={subtitle}
    icon={icon}
    iconImage={iconImage}
    tintIcon={tintIcon}
    disabled={disabled}
    onPress={disabled ? undefined : () => onValueChange(!value)}
    showChevron={false}
    testID={testID}
    trailing={
      <ThemedSwitch
        value={value}
        disabled={disabled}
        // The row already handles the press and announces itself as a switch;
        // leaving the control focusable too would double it up for a screen
        // reader.
        onValueChange={onValueChange}
      />
    }
  />
);

SettingsToggleRow.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  value: PropTypes.bool.isRequired,
  onValueChange: PropTypes.func.isRequired,
  icon: PropTypes.string,
  iconImage: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  tintIcon: PropTypes.bool,
  disabled: PropTypes.bool,
  testID: PropTypes.string,
};

/**
 * A titled group of settings.
 *
 * The screen used to be one unbroken column of rows with a bare label dropped
 * in every so often — every row the same weight, nothing to rest on, which is
 * what made it feel congested. Each group is now a rounded card on a recessed
 * ground, with its heading outside and above it. That gives the eye an edge to
 * follow, makes the groups countable at a glance, and costs no extra colour:
 * the card is `surface`, the ground behind it `backgroundAlt`.
 *
 * Children are the rows. The card clips them, so the first and last rows pick
 * up its rounded corners without needing to know they are first or last — and
 * the same clipping is what removes the last row's divider; see below.
 */
export const SettingsSection = ({ title, children = null }) => {
  const { c, space, layout, radii } = useTokens();
  return (
    <View style={{ marginTop: space.xl, paddingHorizontal: space.md }}>
      <View
        accessible
        accessibilityRole="header"
        style={{ paddingHorizontal: space.sm, paddingBottom: space.sm }}
      >
        <Text variant="label" color="textSecondary">
          {title}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: c.surface,
          borderRadius: radii.lg,
          overflow: "hidden",
          borderWidth: layout.borderWidth.hairline,
          borderColor: c.border,
        }}
      >
        {/* Every row draws a divider under itself, so the LAST row in a card
            drew a hairline a pixel above the card's own bottom border — reading
            as a stray double line just inside the rounded corner.

            Overhanging the content by exactly one hairline pushes that final
            divider past the clip, and `overflow: "hidden"` above removes it.
            Done here rather than by telling the last row not to draw one,
            because a child can render any number of rows (Audio renders four),
            so "which row is last" is not knowable from this level. */}
        <View style={{ marginBottom: -layout.borderWidth.hairline }}>{children}</View>
      </View>
    </View>
  );
};

SettingsSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default SettingsRow;
