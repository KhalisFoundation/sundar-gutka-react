const createStyles = (theme) => ({
  statusContainer: {
    padding: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md_12,
    margin: theme.spacing.md_12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  closeButton: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  statusTitle: {
    fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.audioTitleText,
  },
  statusSubtitle: {
    textAlign: "center",
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.audioTitleText,
  },
  retryButton: {
    padding: theme.spacing.md_12,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: theme.staticColors.WHITE_COLOR,
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: theme.typography.sizes.md_12,
  },
});
export default createStyles;
