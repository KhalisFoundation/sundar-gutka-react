import React from "react";
import { View, StyleSheet } from "react-native";
import { neutral } from "@theme/palette";
import PropTypes from "prop-types";
import useDashboardTheme from "./dashboardTheme";

// Floating white card on the dashboard's soft off-white interface.
//
// Previously this nested two extra "shadow-only" wrapper Views around the card
// to fake a layered (ambient + contact) shadow, since RN only exposes one
// native shadow per view. That backfired on Android: each wrapper rendered as
// its own visible offset box (a "double-stacked card" look) instead of a soft
// blur. A single view with a single well-tuned shadow is far more reliable —
// worth the tradeoff of one shadow layer instead of two.
const RADIUS = 30;
// Exported so anything drawing edge-to-edge inside a card (a background image,
// for instance) can clip itself to the same curve.
export const CARD_RADIUS = RADIUS;
const SHADOW_OFFSET_Y = 8;
const SHADOW_RADIUS = 24;

// How far the shadow reaches past the card's own box. A parent that clips its
// children — a horizontal ScrollView, or anything with overflow hidden — has to
// reserve this much or the shadow gets cut off at the boundary.
export const CARD_SHADOW_BLEED = SHADOW_OFFSET_Y + SHADOW_RADIUS;

// Platform note: shadowColor/shadowOpacity/shadowRadius are iOS-only. Android
// only honors `elevation`, always a fixed neutral-gray shadow with no tint
// control — so the blue-gray tint only shows on iOS; Android gets a plain
// (still soft) gray approximation.
const DashboardCard = ({ style = null, children = null }) => {
  const { isDark, c } = useDashboardTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: c.surface,
          // Both themes take the SAME roles now. The four hardcoded literals
          // that used to live here were a fifth set of colours on this screen.
          borderColor: c.border,
          // The top edge catches a highlight in light mode, the way a raised
          // surface does. In dark there is nothing above it to catch, so it
          // takes the plain border and the card reads flat — which is what dark
          // mode wants anyway, since a drop shadow is invisible on a dark
          // ground and depth has to come from the surface ladder instead.
          borderTopColor: c.edgeHighlight,
        },
        !isDark && styles.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
};

DashboardCard.propTypes = {
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  children: PropTypes.node,
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS,
    borderWidth: 1,
  },
  shadow: {
    // A StyleSheet is module scope, so this cannot read the theme. It only ever
    // applies in light mode (see `!isDark` above), and it is the same slate the
    // neutral ramp is built on.
    shadowColor: neutral[600],
    shadowOffset: { width: 0, height: SHADOW_OFFSET_Y },
    shadowOpacity: 0.12,
    shadowRadius: SHADOW_RADIUS,
    elevation: 6,
  },
});

export default DashboardCard;
