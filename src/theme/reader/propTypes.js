import PropTypes from "prop-types";

// Shared PropTypes for a resolved reading-theme record, so a component that
// renders a theme validates the fields it actually reads instead of declaring
// `PropTypes.shape({})` and losing the check entirely.
//
// Mirrors ALLOWED_SHAPE in schema.js — when a property is added there, add it
// here too if a React component reads it.

const colorSlot = PropTypes.shape({
  color: PropTypes.string.isRequired,
  shadow: PropTypes.string,
});

const readerThemeShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  nameKey: PropTypes.string.isRequired,
  base: PropTypes.oneOf(["light", "dark"]).isRequired,
  background: PropTypes.shape({
    color: PropTypes.string.isRequired,
    // A data URI or remote URL (string), or a require()d asset (number).
    image: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    imageOpacity: PropTypes.number,
    imageRepeat: PropTypes.string,
    imageSize: PropTypes.string,
  }).isRequired,
  text: PropTypes.shape({
    gurbani: colorSlot.isRequired,
    gurbaniHeading: colorSlot.isRequired,
    translation: colorSlot.isRequired,
    transliteration: colorSlot.isRequired,
    teeka: colorSlot,
  }).isRequired,
  typography: PropTypes.shape({
    fontScale: PropTypes.number,
    lineHeightRatio: PropTypes.number,
    letterSpacing: PropTypes.number,
    preferredFontFace: PropTypes.string,
  }).isRequired,
  border: PropTypes.shape({
    width: PropTypes.number,
    color: PropTypes.string,
    style: PropTypes.string,
    radius: PropTypes.number,
    inset: PropTypes.number,
    gap: PropTypes.number,
  }).isRequired,
  chrome: PropTypes.shape({
    headerBackground: PropTypes.string,
    headerForeground: PropTypes.string,
    progressTrack: PropTypes.string,
    progressFill: PropTypes.string,
  }),
});

export default readerThemeShape;
