import React from "react";
import { View } from "react-native";
import PropTypes from "prop-types";
import useTokens from "../../hooks/useTokens";

// A surface that groups related content. The surface/elevation/radius decision,
// made once.
//
// Elevation is theme-dependent and resolved by the token layer, not here: light
// mode draws a real shadow, dark mode lightens the surface instead, because a
// black shadow on a near-black ground is invisible and still costs a render
// pass. A component asking for `elevation="card"` gets whichever is right.
//
// No height, fixed or minimum. A card is exactly as tall as what is inside it,
// which is the only way it survives a long translation or a raised font scale.

const Card = ({
  children = null,
  elevation = "card",
  padded = true,
  surface = "surface",
  style = undefined,
  testID = undefined,
}) => {
  const { c, space, radii, elevation: shadows } = useTokens();

  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: c[surface] ?? surface,
          borderRadius: radii.lg,
          padding: padded ? space.lg : 0,
          gap: space.md,
        },
        shadows[elevation] ?? shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
};

Card.propTypes = {
  children: PropTypes.node,
  /** A preset from `theme.elevation` — none, card, raised, overlay. */
  elevation: PropTypes.oneOf(["none", "card", "raised", "overlay"]),
  /** Set false when the card's children manage their own insets (e.g. a list). */
  padded: PropTypes.bool,
  /** A surface role from `theme.c`. */
  surface: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  testID: PropTypes.string,
};

export default Card;
