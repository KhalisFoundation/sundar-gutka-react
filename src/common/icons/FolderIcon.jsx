import React from "react";
import Svg, { Path } from "react-native-svg";
import { navy } from "@theme/palette";
import PropTypes from "prop-types";

// Fallback only — every call site passes an explicit, themed colour. It exists
// so the stroke is never undefined, which is what the old colors module
// returned: it never defined the keys these icons referenced.
const ICON_FALLBACK = navy[800];

// Folder glyph for the Banis folder rows (Amrit Baani, Bhagat Baani, 22 Vaaran,
// …). A clean rounded outline in the app's stroke-icon style, theme-aware via
// `color` — replaces the old flat grey foldericon.png.
const FolderIcon = ({ size = 26, color = ICON_FALLBACK }) => (
  <Svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="1.6"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </Svg>
);

FolderIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
};

export default FolderIcon;
