import defineReaderTheme from "../schema";

// Today's dark Reader, made pinnable — inherits darkBase wholesale. See light.js.
export default defineReaderTheme({
  id: "dark",
  nameKey: "reader_theme_dark",
  base: "dark",
  order: 2,
});
