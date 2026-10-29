const createStyles = (theme) => {
  return {
  heading: {
    color: theme.c.onPrimary,
    // Baloo Paaji supports both Latin and Gurmukhi, so a single font keeps this
    // first-run screen consistent (no mix of Gurbani-thick + system fonts).
    fontFamily: theme.typography.fonts.balooPaaji,
    textAlign: "center",
    fontSize: theme.typography.sizes.massive + theme.spacing.sm,
  },
  viewWrapper: {
    marginVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
  },
  wrapper: {
    flex: 1,
    backgroundColor: theme.c.primary,
  },
  // Relatively-positioned host for the scrollable and its indicator.
  scrollHost: {
    flex: 1,
  },
  // flexGrow, not flex: the content keeps its own height and scrolls once it is
  // taller than the viewport, while a page short enough to fit still stretches
  // to cover the ground rather than leaving a strip below it.
  scrollContent: {
    flexGrow: 1,
  },
  baniLengthMessage: {
    marginTop: theme.spacing.md,
    color: theme.c.onPrimary,
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: theme.typography.sizes.md,
  },
  textPreferrence: {
    marginTop: theme.spacing.md,
    color: theme.c.onPrimary,
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: theme.typography.sizes.xl,
  },
  button: {
    backgroundColor: theme.c.surface,
    color: theme.c.textPrimary,
    fontFamily: theme.typography.fonts.balooPaaji,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.xxl,
    textAlign: "center",
    textTransform: "uppercase",
    borderRadius: theme.components.button.borderRadius,
    minHeight: theme.components.button.minHeight * 0.9,
  },
  helpText: {
    color: theme.c.goldFill,
    fontFamily: theme.typography.fonts.balooPaaji,
    // No fontWeight/fontStyle: both make Android fall back off the Baloo asset font.
    fontSize: theme.typography.sizes.sm,
    // A row lays its children out at their measured width and RN gives text
    // flexShrink 0, so beside the icon a long translation at a raised text size
    // overflowed the row and was clipped on the right instead of wrapping.
    flexShrink: 1,
  },
  helpWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.md,
    // The icon alone is 30pt, which is under the 44pt minimum for a target.
    minHeight: theme.components.button.minHeight,
  },
  };
};
export default createStyles;
