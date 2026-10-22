import { paletteFor } from "@theme/screenPalettes";

const createStyles = (theme) => ({
  container: {
    flex: 1,
  },
  // The two tabs, laid out end to end so a swipe can slide between them.
  pager: {
    flexDirection: "row",
  },
  // NB: nine style blocks were removed from here — `header`, `fateh`,
  // `headerDesign`, `headerTitle`, `titleContainer`, `settingIcon`,
  // `headerFatehStyle`, `fatehContainer` and `ikongkar`. They belonged to the
  // navy header this screen used to have, nothing referenced them any more, and
  // between them they held every remaining legacy `theme.colors` /
  // `staticColors` read in this screen. `react-native/no-unused-styles` cannot
  // see them because the styles live in this file and are consumed in another.
  newHeaderContainer: {
    // The bani list keeps its OWN ground — the navy this screen had before the
    // token migration. Only the ground: every other colour here still comes
    // from the semantic roles. See theme/screenPalettes.js.
    backgroundColor: paletteFor("baniList", theme).surface,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  newHeaderInvocationText: {
    fontSize: 15,
    color: theme.c.textSecondary,
    fontFamily: theme.typography.fonts.balooPaaji,
    textAlign: "center",
    opacity: 0.8,
  },
  // Ik Onkar "<>" ligature. The Gurbani face is not a choice — it is the only
  // one that draws the elongated stroke over the onkar; Baloo would render the
  // two characters literally.
  //
  // Colour is set EXPLICITLY and must stay that way. It does not inherit from
  // newHeaderInvocationText: CustomText always passes `color="textPrimary"`
  // down, and a caller's style only wins when it names a colour of its own. A
  // glyph with no colour therefore came out textPrimary while the line around
  // it was textSecondary — a visible mismatch in both themes.
  //
  // Size matches the line for the same reason: at 18 against the line's 15 it
  // read as heavier as well as larger.
  ikOnkarGlyph: {
    fontFamily: theme.typography.fonts.gurbaniPrimary,
    fontSize: 15,
    color: theme.c.textSecondary,
  },
  // Floral ornaments ("Œ"/"‰") flanking the title — Gurbani font, tinted with
  // the title colour so they track light/dark like the rest of the header.
  titleFlower: {
    fontFamily: theme.typography.fonts.gurbaniPrimary,
    fontSize: theme.typography.sizes.huge,
    color: theme.c.headerFg,
    // Never gives way. The app name beside it can wrap onto a second line; an
    // ornament has no second line to wrap onto and half of one just looks
    // broken, so the name absorbs the pressure instead.
    flexShrink: 0,
  },
  // Shrinks in place of the Text it wraps. A `Text` carrying `flexShrink`
  // directly inside a row is measured for height at its UNSHRUNK width — one
  // line — and keeps that height after the width is narrowed, so the wrapped
  // second line is laid out past the bottom of the box and clipped. That is why
  // the header showed "ਸੁੰਦਰ" with no "ਗੁਟਕਾ" on an ordinary phone. A View has
  // no such coupling: it shrinks, and the Text inside reports its real wrapped
  // height.
  titleNameWrap: {
    flexShrink: 1,
  },
  newHeaderTitleText: {
    fontSize: 32,
    // NO lineHeight — not here, and not passed in by BaniHeader either. This
    // Text is laid out inside a row (`titleCenter`), and React Native cuts a
    // Text off on Android when it carries an explicit lineHeight in a row:
    // facebook/react-native#53286. That is what made the header read "ਸੁੰਦਰ"
    // with no "ਗੁਟਕਾ" — the wrapped second line simply never drew.
    //
    // Unset is also the more correct answer. The font supplies its own line
    // spacing, which scales with `fontSize`, so the OS text setting is followed
    // without a hand-computed value having to reproduce it.
    fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    color: theme.c.headerFg,
    textAlign: "center",
    marginTop: 1.2, // 40% less than the original 2px gap to the invocation line above
    // Was two literal spaces inside the string. Real padding survives wrapping;
    // a leading space does not, and would have indented the first line.
    paddingHorizontal: 8,
  },
  // Holds ornament + name + ornament on one line, centred, and is itself the
  // flexible middle column between the two 48pt side slots.
  titleCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  // Three columns, not an absolutely-positioned icon over a full-width title.
  //
  // The gear used to be `position: absolute; right: 12` above a title that
  // stretched the whole header. That keeps the title perfectly centred right up
  // until it stops fitting — then the title and its flowers simply run
  // UNDERNEATH the icon, and on a small screen at a raised text size the right
  // ornament swallowed the gear entirely.
  //
  // `ScreenHeader` already documents this exact trap ("the folder header used
  // absolute positioning, so a long Gurmukhi title ran underneath the arrow").
  // Equal side slots keep the title optically centred AND reserve the gear's
  // room, so the two cannot occupy the same pixels.
  titleRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
  },
  // Mirrors settingsWrap on the left so the centre column is truly centred.
  titleSpacer: {
    width: 48,
  },
  settingsWrap: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  newHeaderGradientDivider: {
    marginTop: theme.spacing.sm,
  },
  // The All Banis / Folders switch. Full-bleed: the tab bar carries its own bottom rule and sits flush against
  // the list, so an inset here would leave the rule short of the screen edge.
  tabs: {
    backgroundColor: paletteFor("baniList", theme).surface,
  },
});

export default createStyles;
