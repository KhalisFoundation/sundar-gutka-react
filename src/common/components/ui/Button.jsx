import React from "react";
import { Pressable, View } from "react-native";
import PropTypes from "prop-types";
import useTokens from "../../hooks/useTokens";
import Spinner from "./Spinner";
import Text from "./Text";

// The app's button. There was no shared one: 314 touchables were each styled
// locally, which is why no two dialogs or forms agree on button height, radius
// or label size.
//
// Sizing is entirely content-driven. There is no fixed width and no fixed
// height — only a `minHeight` that grows with the OS font scale — because the
// label is a translated string that runs 2–4x longer in `hi`/`pa`/`fr`/`es`
// than in English. A button sized to fit "Save" cannot fit "ਸੰਭਾਲੋ ਅਤੇ ਬੰਦ ਕਰੋ".
// Long labels wrap rather than shrink or clip.

const VARIANTS = {
  // Default call to action.
  //
  // It reads `ctaFill`, NOT `primary`. `primary` is the bottom nav bar's
  // colour, and a screen palette that overrode it to make a button legible
  // repainted the nav bar too. The CTA is its own role so the two can never be
  // coupled again; where a palette does not define it, it falls back to
  // `primary` and nothing changes.
  primary: {
    bg: ["ctaFill", "primary"],
    bgPressed: ["ctaFillPressed", "primaryPressed"],
    fg: ["onCtaFill", "onPrimary"],
    border: null,
  },
  /** Secondary action alongside a primary one. */
  secondary: { bg: null, bgPressed: "surfaceSelected", fg: "accent", border: "borderStrong" },
  /** Tertiary / low-emphasis action. */
  ghost: { bg: null, bgPressed: "surfaceSelected", fg: "accent", border: null },
  /**
   * Irreversible action — delete a pothi, delete a download, clear data.
   *
   * It reads `errorFill`, not `error`. Error TEXT has to clear 4.5:1 on every
   * surface, which makes it the darkest red in the ramp; a button painted that
   * colour reads as heavier than the choice it offers. The fill is its own role
   * so the two can move apart, and it falls back to `error` where a palette
   * does not define it.
   */
  destructive: {
    bg: ["errorFill", "error"],
    bgPressed: ["errorFill", "error"],
    fg: ["onErrorFill", "onError"],
    border: null,
  },
};

const Button = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon = null,
  fullWidth = false,
  accessibilityLabel = undefined,
  accessibilityHint = undefined,
  testID = undefined,
  style = undefined,
}) => {
  const { c, space, layout, radii } = useTokens();
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const isSmall = size === "sm";
  const inactive = disabled || loading;

  // Disabled state is expressed by flattening the fill rather than by opacity,
  // so the label keeps its contrast ratio instead of fading under it.
  /** A role name, or a [preferred, fallback] pair for the CTA roles above. */
  const role = (name) => (Array.isArray(name) ? c[name[0]] ?? c[name[1]] : c[name]);

  const background = (pressed) => {
    if (inactive) return v.bg ? c.surfaceSelected : "transparent";
    if (pressed && v.bgPressed) return role(v.bgPressed);
    return v.bg ? role(v.bg) : "transparent";
  };

  const foreground = inactive ? c.textDisabled : role(v.fg);

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      // A disabled button must not eat a scroll that starts on top of it.
      //
      // Pressability declines the responder when disabled
      // (`onStartShouldSetResponder` returns `!disabled`), so the gesture
      // bubbles PAST this button to the first ancestor that will take it —
      // inside a Sheet that is the panel's own tap-swallowing Pressable, and an
      // ancestor holding the responder is what stops the ScrollView underneath
      // from scrolling. An enabled button never hits this: it grants the
      // responder itself and the scroll view steals it back on move.
      //
      // `box-none` takes this view out of hit testing while leaving it
      // interactive to the platform, so the drag resolves to the scrollable
      // behind it. NOT `none`, which sets userInteractionEnabled = NO on iOS
      // and would take a disabled button out of VoiceOver — it still has to be
      // announced, and announced as disabled.
      pointerEvents={inactive ? "box-none" : "auto"}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      testID={testID}
      style={({ pressed }) => [
        {
          // A minimum, never a fixed height — the label decides the rest.
          minHeight: isSmall ? layout.touchTarget * 0.8 : layout.touchTarget,
          paddingHorizontal: isSmall ? space.md : space.lg,
          paddingVertical: space.sm,
          borderRadius: radii.md,
          backgroundColor: background(pressed),
          borderWidth: v.border ? layout.borderWidth.hairline : 0,
          borderColor: v.border ? c[inactive ? "border" : v.border] : "transparent",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: space.sm,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        style,
      ]}
    >
      {loading ? (
        <Spinner size="small" color={foreground} testID="button-spinner" />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          {/* flexShrink lets a long translation wrap inside the button instead
              of pushing the icon out or overflowing the row. */}
          <Text variant="label" align="center" style={{ color: foreground, flexShrink: 1 }}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};

Button.propTypes = {
  title: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(["primary", "secondary", "ghost", "destructive"]),
  size: PropTypes.oneOf(["sm", "md"]),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.node,
  fullWidth: PropTypes.bool,
  accessibilityLabel: PropTypes.string,
  accessibilityHint: PropTypes.string,
  testID: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

export default Button;
