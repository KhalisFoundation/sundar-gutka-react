import React from "react";
import Svg, { Path, Polyline, Rect } from "react-native-svg";
import PropTypes from "prop-types";

const Replay10Icon = ({ size = 24, color }) => {
    return (
        <Svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
        >
            {/* Arrow head */}
            <Polyline
                points="9.57 15.41 12.17 24.05 20.81 21.44"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Number 1 (smaller) */}
            <Path
                d="M25.5 38.8V25.5a.09.09 0 0 0-.16-.07s-1.9 2.7-3.3 3.8"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
            />

            {/* Number 0 (smaller) */}
            <Rect
                x="31"
                y="24.5"
                width="9"
                height="15"
                rx="4.5"
                stroke={color}
                strokeWidth="4"
            />

            {/* Circular rewind arrow */}
            <Path
                d="M12.14 23.94a21.91 21.91 0 1 1-.91 13.25"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
            />
        </Svg>
    );
};

Replay10Icon.propTypes = {
    size: PropTypes.number,
    color: PropTypes.string.isRequired,
};

export default Replay10Icon;