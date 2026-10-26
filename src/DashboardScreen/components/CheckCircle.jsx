import React from "react";
import Svg, { Circle, Polyline } from "react-native-svg";
import { neutral } from "@theme/palette";
import PropTypes from "prop-types";

// The dashboard's checklist mark: a ring when unticked, a filled disc with a
// tick when done.
//
// One component, because it was two identical copies — Today's Nitnem drew it
// in the accent blue and Edit Banis drew the same twenty lines in gold, which
// is how the sheet that edits the Nitnem ended up looking like a different
// feature from the list it edits. They share this now, so they cannot drift
// again.
//
// `tick` defaults to white: every accent this is filled with is dark enough in
// light mode and light enough in dark mode for that to hold, which is the
// property `accent` is chosen for. A caller filling it with something paler
// must pass its own tick.
const CheckCircle = ({ filled, accent, muted, tick = neutral[0] }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="12"
      r="10"
      fill={filled ? accent : "none"}
      stroke={filled ? accent : muted}
      strokeWidth="2"
    />
    {filled ? (
      <Polyline
        points="17 9 10.5 15.5 7 12"
        fill="none"
        stroke={tick}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : null}
  </Svg>
);

CheckCircle.propTypes = {
  filled: PropTypes.bool.isRequired,
  /** The fill and the ring when ticked. */
  accent: PropTypes.string.isRequired,
  /** The ring when unticked. */
  muted: PropTypes.string.isRequired,
  tick: PropTypes.string,
};

export default CheckCircle;
