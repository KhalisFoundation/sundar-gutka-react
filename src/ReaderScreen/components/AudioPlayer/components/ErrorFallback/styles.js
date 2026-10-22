import { Platform } from "react-native";

const createStyles = (theme) => ({
  statusContainer: {
    padding: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md_12,
    margin: theme.spacing.md_12,
    borderRadius: theme.borderRadius.md,
    // Stands in place of the player, so it takes the player's surface — see the
    // note in the Loading styles beside it.
    backgroundColor: theme.c.surface,
  },
  closeButton: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 10,
  },
  noTracksContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  noTracksText: {
    fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    fontSize: theme.typography.sizes.xxl,
    color: theme.c.textPrimary,
  },
  noTracksSubtext: {
    fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    fontSize: theme.typography.sizes.xxl,
    color: theme.c.textPrimary,
    textAlign: "center",
  },
  titleText: {
    fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    fontSize: theme.typography.sizes.xxl,
    color: theme.c.textPrimary,
  },
  joinMailingListButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md_12,
  },
  joinMailingListText: {
    color: theme.c.link,
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.fonts.balooPaaji,
    textDecorationLine: "underline",
    // Centre wrapped lines so longer translations (e.g. French/Italian) stay
    // centred rather than rendering left-aligned when the label spans two lines.
    textAlign: "center",
  },
  joinMailingListArrow: {
    // System font (not BalooPaaji, which lacks the arrow glyph) so "→" renders
    // identically across OEMs. Not underlined, unlike the label it follows.
    fontFamily: Platform.select({ android: "sans-serif", ios: "Helvetica" }),
    textDecorationLine: "none",
    // Named explicitly, NOT inherited from joinMailingListText. CustomText
    // always passes `color="textPrimary"` down and a caller's style only wins
    // when it names a colour, so an unstyled nested glyph came out as body
    // text beside a link-coloured label.
    color: theme.c.link,
  },
});
export default createStyles;
