import { StyleSheet } from "react-native";
import { androidLineHeight } from "@theme/lineHeight";
import { themeForScreen } from "@theme/screenPalettes";

const createStyles = (theme) => {
  // Seva draws with its OWN colours, resolved through the same role names the
  // rest of the app uses, so every c.x below is unchanged and only the values
  // differ. Roles Seva does not override still come from the semantic layer.
  const { c } = themeForScreen(theme, "seva");

  return StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: c.backgroundAlt,
    },
    // flexGrow keeps the background filling the viewport when content is short.
    // NB: no justifyContent:center — centering shifts the content's origin away
    // from the scroll offset's 0, which breaks measuring a child's position for
    // the "scroll an opened accordion into view" logic. Top-aligned is correct
    // for the accordion layout anyway.
    scrollContent: {
      flexGrow: 1,
    },
    // Spacing is an explicit `gap` (set responsively by the screen), NOT
    // justifyContent: "space-between". space-between distributes LEFTOVER space,
    // so the gaps grew on tall devices and collapsed to zero on short ones —
    // that was the whole "spacing differs per device / everything is cramped"
    // bug. A fixed gap renders identically everywhere and simply scrolls when
    // there isn't room.
    container: {
      width: "100%",
      backgroundColor: c.backgroundAlt,
      // stretch → hero/section text and cards fill the width and left-align.
      alignItems: "stretch",
    },
    // NB: `header`, `backButton`, `headerTitle` and `headerSpacer` were removed
    // from here. They belonged to a hand-rolled navy header this screen no
    // longer draws — it uses the shared `AppBar` now — and nothing referenced
    // them. They also held the last two legacy colour reads in this screen.
    // Bold is expressed by naming the SemiBold FILE, never by a numeric weight
    // beside the family. Baloo ships as separate named TTFs, so a weight makes
    // Android try to synthesize and silently drop to the system font.
    title: {
      fontSize: 32,
      color: c.textPrimary,
      textAlign: "center",
      fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    },
    headline: {
      color: c.textPrimary,
      textAlign: "center",
      fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    },
    description: {
      fontSize: 15,
      lineHeight: androidLineHeight(22),
      color: c.textSecondary,
      textAlign: "left",
      width: "100%",
      fontFamily: theme.typography.fonts.balooPaaji,
    },
    link: {
      color: c.accent,
      textDecorationLine: "underline",
      fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    },
    // The amount, in a faint box of a FIXED width.
    //
    // It was a filled card with a shadow; the fill and the shadow are gone and
    // a hairline is all that is left. The width stays the page's, deliberately:
    // sized to the figure the box grew and shrank on every keystroke, which
    // made the one thing you are reading move while you typed it. A steady
    // frame with the number centred in it is easier to read against.
    //
    // "/month" sits inline in the row rather than on a second line below.
    amountCard: {
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingTop: 8,
      paddingBottom: 10,
      paddingHorizontal: 20,
      width: "100%",
      alignItems: "center",
    },
    // The card is a control now (tapping the figure switches to Other), so
    // it acknowledges the touch.
    amountCardPressed: {
      opacity: 0.85,
    },
    amountContainer: {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    // flex-end: the symbol and digits now share ONE font (see amountFontFamily
    // in index.jsx), so aligning their box bottoms aligns their baselines. The
    // small "/month" sits at the same bottom edge.
    amountRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "center",
      // Full width, not maxWidth — see amountDisplay's `flex: 1` below.
      width: "100%",
    },
    // The amount figure is one inline Text. Digits are ALWAYS Baloo; the symbol
    // span sets its own fontFamily inline. includeFontPadding:false keeps the
    // baseline tight so inline spans of different fonts line up.
    //
    // `flex: 1` (with width:100% on the row above) hands it the card's full
    // width instead of letting it size to its own measurement. A run of mixed
    // fonts and sizes measures a little short, and a content-sized box is
    // exactly as wide as that short measurement — so the shortfall lands as an
    // ellipsis on a figure with a whole card of empty space beside it. Given
    // the real width, a few px of measuring error has nowhere to bite.
    // textAlign (below) keeps the figure centred now the box is full-width.
    amountDisplay: {
      flex: 1,
      fontFamily: theme.typography.fonts.balooPaaji,
      color: c.textPrimary,
      textAlign: "center",
      includeFontPadding: false,
      padding: 0,
    },
    // Inline "0" placeholder span (muted) — shown before the user types.
    amountPlaceholder: {
      color: c.textSecondary,
    },
    // Inline "/month" span beside the amount (smaller + muted, same baseline).
    perMonthSpan: {
      fontSize: 18,
      fontFamily: theme.typography.fonts.balooPaaji,
      color: c.textSecondary,
    },
    // The real, offscreen input that captures keystrokes for the custom amount.
    // The visible figure is the inline Text above; this stays invisible so the
    // ₹ symbol and digits can be one baseline-aligned inline run.
    hiddenInput: {
      position: "absolute",
      opacity: 0,
      height: 1,
      width: 1,
    },
    // Always ONE row on every device. The old flexWrap + minWidth:70 pushed
    // "Other" onto its own line on narrower screens but not wider ones — the
    // most visible per-device inconsistency. Equal flex:1 columns divide
    // whatever width is available, so the row is identical everywhere.
    // Sits directly under the amount card, where the donor is looking while
    // typing — NOT in a bottom toast. The keyboard is up the whole time an
    // amount is being typed, and a bottom toast fires behind it: the donor saw
    // a Donate tap do nothing and never got the reason.
    minAmountNotice: {
      fontSize: 13,
      lineHeight: androidLineHeight(18),
      color: c.error,
      textAlign: "center",
      width: "100%",
      fontFamily: theme.typography.fonts.balooPaaji,
    },
    amountButtons: {
      flexDirection: "row",
      // Wraps onto a second line rather than dividing one line four ways
      // whatever the labels need. See amountButton.
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 10,
      width: "100%",
    },
    amountButton: {
      // Grows to share the row, but STARTS from its own label's width.
      //
      // It was `flex: 1, minWidth: 0` — an exact quarter of the row each, and
      // permission to shrink below the content. At a raised OS text size a
      // quarter is narrower than the word, and a word with nowhere to wrap
      // breaks mid-word: "Other" rendered as "Othe" over "r". Starting from the
      // label's own width means a chip is never handed less room than its word,
      // and the row wraps when four of them no longer fit across.
      flexGrow: 1,
      flexBasis: "auto",
      paddingHorizontal: 6,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: c.borderStrong,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    amountButtonSelected: {
      backgroundColor: c.controlAccent,
      borderColor: c.controlAccent,
    },
    amountButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: c.textPrimary,
      textAlign: "center",
    },
    amountButtonTextSelected: {
      // Pairs with controlAccent: white on the navy pill in light, near-black
      // on the bright blue one in dark. Reading onPrimary here put white on the
      // dark-mode blue at 3.7:1.
      color: c.onControlAccent,
    },
    // Monthly / One Time, as ONE segmented control rather than two loose
    // radios: a box split down the middle, so the pair reads as a single
    // either-or choice and each half is a real target instead of a 22pt circle.
    //
    // A hairline and nothing else — no fill, no shadow, no elevation, so it
    // matches the amount box above it. It is drawn to fit the two labels rather
    // than the screen, so the edge sits just outside them
    // and moves with the language: a box the width of the page around two short
    // words is a slab, not a control. `maxWidth` is the only cap, for the long
    // translations.
    frequencyContainer: {
      flexDirection: "row",
      alignItems: "stretch",
      alignSelf: "center",
      maxWidth: "100%",
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      overflow: "hidden",
    },
    // Each half sizes to its own label rather than claiming an equal share, so
    // the box tracks the words inside it. No fixed height: the label wraps and
    // the row grows with it, so a long translation or a raised OS text size
    // makes the control taller rather than clipping the word.
    frequencyOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 1,
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 18,
      minHeight: 48,
    },
    frequencyOptionPressed: {
      opacity: 0.7,
    },
    // Past a raised text size the two halves cannot share a line: half the
    // panel is narrower than "Monthly", and a single word with nowhere to wrap
    // breaks mid-word — it rendered as "Monthl" over "y". Stacked, each half
    // has the full width and the words stay whole.
    frequencyContainerStacked: {
      flexDirection: "column",
      // No longer a pair of columns to centre; the panel takes the width it is
      // given and each row fills it.
      alignSelf: "stretch",
    },
    // A hairline between the halves, inset top and bottom so it reads as a
    // divider rather than as the panel being two boxes.
    frequencyDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      marginVertical: 12,
    },
    // The same rule turned through 90 degrees when the halves stack, inset on
    // the sides for the same reason it is inset top and bottom when upright.
    frequencyDividerStacked: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      marginHorizontal: 12,
    },
    // A CIRCLE — radius is half the box. It was 7 on a 22pt box, which is a
    // rounded square, and both states were drawn in the accent, so a chosen
    // frequency looked the same as the one beside it.
    radioRing: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
    },
    // The link blue: the same colour in light, its own brighter blue in dark.
    radioRingOn: {
      borderColor: c.accent,
    },
    // The muted ink, so the empty ring and the label beside it are one colour.
    // NOT `borderStrong`, which is this screen's 2pt pill outline and measures
    // 1.4:1 on the dark panel — invisible as the only mark of an unchosen state.
    radioRingOff: {
      borderColor: c.textSecondary,
    },
    radioDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: c.accent,
    },
    frequencyText: {
      fontSize: 14,
      flexShrink: 1,
      color: c.textSecondary,
      fontFamily: theme.typography.fonts.balooPaaji,
    },
    // The chosen one carries both the colour and the weight. Baloo ships as
    // separate named files, so this is the SemiBold face and never a numeric
    // fontWeight, which Android would try to synthesise and drop to the system
    // font instead.
    frequencyTextOn: {
      color: c.accent,
      fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    },
    donateButton: {
      borderRadius: 100,
      alignSelf: "center",
      overflow: "hidden",
    },
    donateIconCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.surfaceBright,
      alignItems: "center",
      justifyContent: "center",
    },
    donateIcon: {
      fontSize: 18,
      color: c.textBrand,
    },
    donateButtonText: {
      fontSize: 22,
      // The button is a gradient of controlAccent -> controlAccentPressed, so
      // its label takes that pairing: white on the navy in light, near-black on
      // the bright blue in dark.
      color: c.onControlAccent,
      fontFamily: theme.typography.fonts.balooPaaji,
    },
    // Pairs with the flattened disabled fill on the button — see the gradient in
    // index.jsx. Matches the shared ui/Button's disabled foreground.
    donateButtonTextDisabled: {
      color: c.textDisabled,
    },
    footerText: {
      fontSize: 13,
      color: c.textSecondary,
      textAlign: "center",
      lineHeight: androidLineHeight(18),
      paddingHorizontal: 16,
      fontFamily: theme.typography.fonts.balooPaaji,
    },
    taxNote: {
      fontSize: 13,
      lineHeight: androidLineHeight(18),
      color: c.textSecondary,
      textAlign: "center",
      width: "100%",
      paddingHorizontal: 8,
      fontFamily: theme.typography.fonts.balooPaaji,
    },
    // ─── New server-driven layout (hero + donate card + "other ways" list) ────
    heroTitle: {
      // Swapped with the AppBar "Seva" title: the hero line is now the smaller
      // of the two (the AppBar is 26).
      fontSize: 20,
      lineHeight: androidLineHeight(26),
      color: c.textPrimary,
      fontFamily: theme.typography.fonts.balooPaajiSemiBold,
      includeFontPadding: false,
    },
    heroDesc: {
      fontSize: 15,
      lineHeight: androidLineHeight(22),
      color: c.textSecondary,
      width: "100%",
      // Left, not justified. Justification stretches the word gaps on every
      // line but the last, which reads as ragged holes at this measure, and
      // Android only honours it from API 26 anyway — below that it silently
      // fell back to left, so the screen already differed by OS version.
      textAlign: "left",
      fontFamily: theme.typography.fonts.balooPaaji,
    },
    sectionHeader: {
      fontSize: 18,
      fontWeight: "normal",
      color: c.textPrimary,
      width: "100%",
      textAlign: "left",
      marginTop: 2,
      fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    },
    // Donate card
    donateCard: {
      width: "100%",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceElevated,
      padding: 16,
      gap: 14,
    },
    donateCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    cardIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surfaceSelected,
    },
    donateCardHeaderText: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 17,
      color: c.textPrimary,
      fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    },
    cardSub: {
      fontSize: 13.5,
      lineHeight: androidLineHeight(18),
      color: c.textSecondary,
      marginTop: 2,
      fontFamily: theme.typography.fonts.balooPaaji,
    },
    // "Other ways to do Seva" list rows
    meansRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      width: "100%",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceElevated,
      paddingVertical: 13,
      paddingHorizontal: 14,
    },
    meansIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    meansTextWrap: {
      flex: 1,
    },
    meansTitle: {
      fontSize: 15.5,
      color: c.textPrimary,
      fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    },
    meansSub: {
      fontSize: 13,
      lineHeight: androidLineHeight(17),
      color: c.textSecondary,
      marginTop: 2,
      fontFamily: theme.typography.fonts.balooPaaji,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: c.backgroundAlt,
    },
    retentionBanner: {
      backgroundColor: c.goldSurface,
      borderColor: c.gold,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      width: "100%",
    },
    retentionText: {
      color: c.goldText,
      fontSize: 14,
      textAlign: "center",
      fontWeight: "600",
    },
  });
};

export default createStyles;
