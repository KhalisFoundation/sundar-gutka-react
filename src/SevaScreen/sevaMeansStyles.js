import { StyleSheet } from "react-native";
import { androidLineHeight } from "@theme/lineHeight";
import { themeForScreen } from "@theme/screenPalettes";

// Native styling for the server-driven "Seva by other means" pages. Colours
// mirror the Seva page (createStyles in ./styles) so both screens read as one
// system in light and dark mode.
//
// SPACING: this file deliberately carries NO vertical margins between blocks.
// The screen owns the vertical rhythm through a single viewport-derived `gap`
// on the content wrapper (see SevaMeansScreen), exactly like the main Seva
// page — so spacing stays consistent between every element and scales with the
// device instead of being a pile of mismatched hardcoded margins.
const createStyles = (theme) => {
  // Same colours as the main Seva page, resolved through the same role names.
  const { c } = themeForScreen(theme, "seva");

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.backgroundAlt,
    },
    scrollView: { flex: 1 },
    // Padding + gap are applied dynamically on the inner wrapper View in the
    // screen; flexGrow lets a short page still fill the viewport.
    scrollContent: { flexGrow: 1 },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: c.backgroundAlt,
    },
    intro: {
      fontSize: 16,
      lineHeight: androidLineHeight(24),
      color: c.textSecondary,
      fontFamily: theme.typography.fonts.balooPaaji,
    },
    description: {
      fontSize: 15,
      lineHeight: androidLineHeight(22),
      color: c.textSecondary,
      fontFamily: theme.typography.fonts.balooPaaji,
    },
    // NB: no numeric fontWeight anywhere the Baloo SemiBold font is used —
    // pairing an explicit custom font with fontWeight 700/800 makes Android
    // fall back to Roboto. The SemiBold font already carries the weight.
    sectionHeading: {
      fontSize: 13,
      fontWeight: "normal",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: c.textSecondary,
      fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    },
    // A tappable link "card" row: optional leading badge, text, trailing chevron.
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: c.surfaceElevated,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    linkRowInner: {
      flex: 1,
      // Title and (optional) subtitle stack with a tight, consistent gap.
      gap: 3,
    },
    linkRowText: {
      fontSize: 15,
      lineHeight: androidLineHeight(21),
      color: c.textSecondary,
      fontFamily: theme.typography.fonts.balooPaaji,
    },
    link: {
      color: c.accent,
      fontWeight: "normal",
      fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    },
    heroTitle: {
      fontSize: 24,
      fontWeight: "normal",
      textAlign: "center",
      color: c.textPrimary,
      fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    },
    heroSub: {
      fontSize: 16,
      lineHeight: androidLineHeight(24),
      textAlign: "center",
      color: c.textSecondary,
      paddingHorizontal: 16,
      fontFamily: theme.typography.fonts.balooPaaji,
    },
    footer: {
      fontSize: 13,
      lineHeight: androidLineHeight(18),
      textAlign: "center",
      color: c.textSecondary,
      fontFamily: theme.typography.fonts.balooPaaji,
    },
  });
};

export default createStyles;
