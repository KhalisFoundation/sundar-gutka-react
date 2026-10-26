// Remaining Settings styles.
//
// The screen's rows now come from `components/comon/SettingsRow`, which is
// built on the shared `Row` primitive, so the row/section/header styles this
// file used to carry are gone along with the eight keys that had no consumers
// left (`nightBackColor`, `iconStyle`, `imageStyle`, `settingText`,
// `settingsView`, `displayOptionsText`, `avatarStyleUntinted`,
// `listItemSubtitle`).
//
// What is left serves the bottom sheet, the two picker rows and the BaniDB
// update banner, and migrates when those do.
const createStyles = (theme) => ({
  bottomSheetTitle: {
    textAlign: "center",
    fontSize: theme.typography.sizes.xxl,
    padding: theme.spacing.xl,
    borderTopLeftRadius: theme.radius.lg + theme.spacing.sm,
    borderTopRightRadius: theme.radius.lg + theme.spacing.sm,
    fontWeight: theme.typography.weights.medium,
  },
  titleInfoStyle: {
    fontSize: theme.typography.sizes.sm,
    // Match the left-hand setting name (white in dark, near-black in light)
    // instead of the muted bluish-grey textDisabled.
    color: theme.c.textPrimary,
  },
  // tintColor recolors these monochrome PNG setting icons to match the vector
  // (@rneui) icons — near-black in light, near-white in dark — so none of them
  // render as low-contrast grey-on-grey.
  avatarStyle: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    tintColor: theme.c.textPrimary,
  },
  iconContainerStyle: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  viewWrapper: {
    justifyContent: "center",
    marginTop: "auto",
    marginLeft: "auto",
    marginRight: "auto",
    bottom: 0,
    borderTopLeftRadius: theme.radius.lg + theme.spacing.sm,
    borderTopRightRadius: theme.radius.lg + theme.spacing.sm,
    overflow: "hidden",
  },
  width_100: {
    width: "98%",
  },
  width_90: {
    width: "70%",
  },
  blurViewStyle: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },
  androidViewWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
    width: "100%",
  },
  databaseUpdateBannerWrapper: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: theme.c.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.sm,
  },
  baniDbImage: {
    width: theme.spacing.xl,
    height: theme.spacing.xl,
    marginRight: theme.spacing.md,
  },
  updateText: {
    color: theme.c.onPrimary,
    fontSize: theme.typography.sizes.md,
  },
  listItemTitle: {
    color: theme.c.textPrimary,
    fontSize: theme.typography.sizes.lg,
    // Baloo Paaji carries Devanagari/Gurmukhi matras above and below the
    // baseline, which clip at the 1.4 line height sized for Latin. 1.6 also
    // keeps the two lines of a long translation from touching.
    lineHeight: theme.typography.sizes.lg * theme.typography.lineHeights.relaxed,
  },
  containerNightStyles: {
    backgroundColor: theme.c.backgroundAlt,
    // Override RNEUI's `bottomDivider` hairline (1px ÷ pixelRatio ≈ 0.38dp),
    // which rounds to 0 on every other row on non-integer-density screens,
    // making alternating dividers vanish. A solid 1dp line never collapses.
    borderBottomWidth: 1,
    borderBottomColor: theme.c.border,
  },
});
export default createStyles;
