export const createStyles = ({ c, space, layout, type }) => ({
  rowItem: {
    // A minimum, not a fixed height: the Gurmukhi name renders large and a long
    // title must be able to make the row taller rather than clip.
    //
    // Padding is deliberately tight. This is a reordering screen — the job is
    // seeing enough banis at once to drag one where you want it, so density
    // matters more here than the breathing room a reading list wants.
    minHeight: layout.row.minHeight,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: space.xs,
    paddingHorizontal: layout.screenGutter,
    backgroundColor: c.background,
  },
  // Inset hairline between rows, matching the bani list. This replaces a
  // `marginTop: 1` that let the container's background show through as a line
  // — and that background was `colors.primaryText`, a TEXT colour, which is
  // near-white in dark mode. Hence the white grid over every row.
  separator: {
    height: layout.borderWidth.hairline,
    backgroundColor: c.border,
    marginHorizontal: layout.screenGutter,
  },
  text: {
    fontFamily: type.fonts.gurbaniPrimary,
    fontSize: type.title.fontSize,
    textAlign: "center",
    color: c.textPrimary,
  },
  gestureHandlerRootView: {
    backgroundColor: c.background,
    flex: 1,
  },
});

/** The lifted look while a row is being dragged. */
export const activeColor = (isActive, backColor, c) => ({
  backgroundColor: isActive ? c.surfaceSelected : backColor,
});
