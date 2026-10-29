import React, { useEffect, useRef } from "react";
import { Animated, Pressable } from "react-native";
import PropTypes from "prop-types";
import useTokens from "@common/hooks/useTokens";

// The app's switch, on design tokens.
//
// It previously carried six hardcoded colours and branched on `isDark` for two
// of them. All four are roles now, and `controlTrackOff` is deliberately ONE
// value for both themes: it clears 3:1 against either ground and against the
// thumb, so the switch needs no per-theme branch. Fewer values, same result —
// verified in `contrast.test.js`, which checks the thumb against both track
// states and each track against the page.
//
// Geometry scales with the OS text-size setting like every other control, so
// the switch stays proportionate to the row label beside it.

const ThemedSwitch = ({
  value,
  onValueChange = undefined,
  disabled = false,
  offThumbColor = null,
  onThumbColor = null,
  thumbBorderColor = null,
  onTrackColor = null,
  offTrackColor = null,
}) => {
  const { c, scale } = useTokens();
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value, progress]);

  // Base geometry at the reference font scale, grown with the user's setting.
  const trackWidth = Math.round(50 * scale.container);
  const trackHeight = Math.round(30 * scale.container);
  const padding = Math.round(3 * scale.container);
  const thumbSize = trackHeight - padding * 2;
  const travel = trackWidth - thumbSize - padding * 2;

  const trackBackgroundColor = progress.interpolate({
    inputRange: [0, 1],
    // `primary`, not `accent`: the ON track is the same blue as the bottom
    // navigation bar, so the app shows one blue instead of two similar ones.
    outputRange: [offTrackColor || c.controlTrackOff, onTrackColor || c.controlAccent],
  });

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, travel] });

  const handlePress = () => {
    if (disabled) return;
    onValueChange?.(!value);
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      onPress={handlePress}
      hitSlop={8}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View
        style={{
          width: trackWidth,
          height: trackHeight,
          borderRadius: trackHeight / 2,
          backgroundColor: trackBackgroundColor,
          padding,
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={{
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            // offThumbColor tints the OFF-state circle only; onThumbColor the
            // ON one. Unset, both fall back to `c.surface`, which reads against
            // either track in either theme where a fixed white does not — but a
            // caller on a coloured card needs to say so, because there the
            // surface role IS the card and the thumb would vanish into it.
            backgroundColor:
              (!value && offThumbColor) || (value && onThumbColor) || c.surface,
            // A hairline keeps a pale thumb legible on a pale track.
            ...(thumbBorderColor ? { borderWidth: 0.5, borderColor: thumbBorderColor } : {}),
            transform: [{ translateX }],
          }}
        />
      </Animated.View>
    </Pressable>
  );
};

ThemedSwitch.propTypes = {
  value: PropTypes.bool.isRequired,
  onValueChange: PropTypes.func,
  disabled: PropTypes.bool,
  offThumbColor: PropTypes.string,
  onThumbColor: PropTypes.string,
  thumbBorderColor: PropTypes.string,
  onTrackColor: PropTypes.string,
  offTrackColor: PropTypes.string,
};

export default ThemedSwitch;
