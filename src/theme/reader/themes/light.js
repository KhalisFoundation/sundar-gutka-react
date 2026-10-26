import defineReaderTheme from "../schema";

// Today's light Reader, made pinnable: choose it and the page stays light even
// while the app is in dark appearance.
//
// It overrides nothing at all, which is the point — the whole record comes from
// lightBase, which is itself derived from the app's light palette. So this is
// both the clearest demonstration that base inheritance carries a complete theme
// and a guarantee that the light reading surface can never drift from the app.
export default defineReaderTheme({
  id: "light",
  nameKey: "reader_theme_light",
  base: "light",
  order: 1,
});
