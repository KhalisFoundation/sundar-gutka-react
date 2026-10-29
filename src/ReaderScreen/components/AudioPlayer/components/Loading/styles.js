const createStyles = (theme) => ({
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md_12,
    margin: theme.spacing.md_12,
    borderRadius: theme.borderRadius.md,
    // Stands IN PLACE OF the player while a track buffers, so it must be the
    // player's own surface. When the two roles differed, every load twitched the
    // player to another grey and back. Light mode never showed it, because both
    // roles are the same white there.
    backgroundColor: theme.c.surface,
  },
});

export default createStyles;
