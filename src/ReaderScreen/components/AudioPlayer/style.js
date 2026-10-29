import { Platform } from "react-native";
import { withAlpha } from "@theme/colorUtils";
import { androidLineHeight } from "@theme/lineHeight";
import { constant } from "@common";

// Depth here is the SHARED elevation scale, the same one the Dashboard cards
// use: theme.elevation.{card,raised,overlay} paired with c.surface.
//
// This file used to carry two depth systems of its own. A local SHADOW map
// whose "light" preset was shadowOpacity 0.04 / elevation 1 -- effectively
// invisible -- and a bespoke coloured glow halo. Light mode's surface is the
// same white as the Reader page behind it, so that invisible shadow left the
// player with nothing separating it from the page, while dark mode separated
// perfectly well on its surface ladder. The two modes disagreed for no reason.
//
// The fill is `surface` — the SAME grey as a Settings or Dashboard card, so the
// player belongs to the same family rather than floating a step lighter than
// everything around it. Separation is then carried the way a card carries it:
// a real shadow in light mode, where surface is the same white as the Reader
// page, and the surface/background step in dark mode, where a black shadow
// would be invisible and the presets zero out.

const createStyles = (theme) => ({
  mainContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: theme.borderRadius.sm,
    margin: theme.spacing.md_12,
    ...theme.elevation.raised,
  },
});

export const audioControlBarStyles = (theme) => ({
  blurOverlay: {
    position: "relative",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
  },
  container: {
    position: "relative",
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: theme.spacing.md_12,
  },
  mainContainer: {
    width: "95%",
    marginLeft: "auto",
    marginRight: "auto",
    borderRadius: theme.borderRadius.md,
    ...theme.elevation.raised,
    // Android draws the elevation shadow as a RECTANGLE (ignoring borderRadius)
    // unless the background is fully opaque, so this stays an opaque surface.
    backgroundColor: theme.c.surface,
  },

  minimizePlayerAnimation: {
    opacity: 0,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  minimizePlayerAnimationActive: {
    zIndex: 1,
  },
  // The player is ONE surface: the bar, the full player, the expansion behind
  // Audios/Options and the settings panel all take `surface`. Splitting them
  // across two roles is invisible in light mode, where both resolve to the same
  // white, but in dark mode it drew the expansion as a slab of a different grey.
  modalAnimation: {
    backgroundColor: theme.c.surface,
    overflow: "hidden",
    // flex-start, NOT center. The panel is capped by an animated maxHeight and
    // clips what does not fit; centring content taller than the cap clips it at
    // BOTH ends, which is why the "Select a track" heading was nowhere to be
    // seen — it was cut off the top rather than sitting above the list.
    justifyContent: "flex-start",
    zIndex: 1,
  },
  moreTracksModalContainer: {
    width: "90%",
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: theme.spacing.lg,
    zIndex: 20,
    // Shrinks, so the cap above reaches the list inside it. Without this the
    // chain stopped here: the list kept its full content height, overflowed the
    // panel and was clipped instead of scrolling.
    flexShrink: 1,
  },
  moreTracksHeaderText: {
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: theme.typography.sizes.lg,
    textAlign: "center",
    color: theme.c.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  timestampWithColor: {
    color: theme.c.textPrimary,
  },
  topControlBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 40,
    padding: 5,
    width: "100%",
    marginLeft: "auto",
    marginRight: "auto",
    zIndex: 1,
  },
  leftControls: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    // Allow the action-button group to shrink so longer localized labels
    // (e.g. "Impostazioni audio") never push the right-hand controls off-screen.
    flexShrink: 1,
    minWidth: 0,
  },
  rightControls: {
    flexDirection: "row",
    gap: theme.spacing.md_12,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButton: {
    borderRadius: theme.borderRadius.xl,
    flexShrink: 1,
    minWidth: 0,
  },
  actionButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fonts.balooPaaji,
    // Shrinks within the pill; combined with adjustsFontSizeToFit the label
    // scales down to fit instead of wrapping or clipping.
    flexShrink: 1,
    minWidth: 0,
    // The pill centres its icon and its label by their BOXES. Android adds font
    // padding above and below the glyphs, and Baloo's own ascent/descent are
    // generous on top of that, so the label's box centre sits away from the
    // letters you can actually see — and the label read off-centre against an
    // icon that was centred exactly. Dropping that padding makes the box agree
    // with the glyphs.
    includeFontPadding: false,
    // With the padding gone the line box is only as tall as the metrics say, so
    // this puts the room back deliberately — Gurmukhi labels carry marks above
    // AND below the letter, and those are what a tight line box clips first.
    //
    // ANDROID only. `includeFontPadding` above does nothing on iOS, so the
    // lineHeight was the only thing acting there — and 22 against Baloo's
    // 28.3pt box pushed the baseline down to 12.2pt from the top, putting the
    // letters ~4.6pt above the middle of the button while the icon beside them
    // was centred exactly. That is the label sitting high in the pill, in
    // English as much as in Gurmukhi. Unset, the face's own box centres to
    // within 0.6pt. It still fits: 28.3pt inside a 40pt bar less 5pt of padding
    // a side.
    lineHeight: androidLineHeight(Math.round(theme.typography.sizes.lg * 1.4)),
    textAlignVertical: "center",
  },
  actionButtonContent: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: theme.spacing.md,
    height: "100%",
    alignItems: "center",
    flexShrink: 1,
    minWidth: 0,
  },
  actionButtonIconContainer: {
    height: "100%",
    justifyContent: "center",
  },
  separator: {
    height: 2,
    backgroundColor: theme.c.border,
    zIndex: 1,
  },
  mainSection: {
    paddingHorizontal: theme.spacing.md_12,
    zIndex: 1,
  },
  // Full width, matching the playback controls directly below it. It used to
  // take 90% and centre itself, which threw away a tenth of the row for no
  // stated reason — and this is the row where the reciter's name lives on
  // whatever the timestamp leaves it, so that tenth was the difference between
  // a name fitting on one line and wrapping.
  trackInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  trackInfoLeft: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing.md,
  },
  trackName: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.fonts.balooPaaji,
    color: theme.c.textPrimary,
    // `trackInfoLeft` is a ROW, and RN gives text flexShrink 0 — so without
    // this the name would hold its measured width and spill out sideways once
    // the column narrowed, instead of wrapping inside it. It carries no line
    // cap now, so wrapping is the whole mechanism.
    flexShrink: 1,
  },
  trackInfoText: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.balooPaaji,
    marginBottom: 2,
  },
  playbackControls: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.md_12,
    gap: theme.spacing.md_12,
  },
  playButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  playButtonLoadingSpinner: {
    minWidth: 30,
  },
  progressContainer: {
    flex: 1,
    marginTop: 2,
    justifyContent: "center",
  },
  progressBar: {
    position: "relative",
    justifyContent: "center",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  // The clock shares a row with the reciter's name, which is sized from
  // whatever this leaves it. So this must not change width as it ticks:
  //   • `tabular-nums` stops a "1" being narrower than a "9", which moved the
  //     name's boundary by a px or two EVERY SECOND — enough to flip a
  //     borderline name between one line and two while the track played.
  //   • minWidth reserves the widest clock the player shows, so the 4→5
  //     character jump at ten minutes (formatTime writes "9:59" then "10:00")
  //     doesn't take a chunk out of the name mid-recitation. 2.75em covers
  //     "00:00" in Baloo; right-aligned so the seconds stay put inside it.
  // Together they make the name's width a function of the name alone.
  timestamp: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.balooPaaji,
    fontWeight: theme.typography.weights.normal,
    fontVariant: ["tabular-nums"],
    minWidth: theme.typography.sizes.md * 2.75,
    textAlign: "right",
  },
  seekLoadingOverlay: {
    position: "absolute",
    right: 0,
    top: -theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});

// No border on a track row. Kept as a constant because the preview sweep is
// positioned by its negative, so the two can never fall out of step.
export const TRACK_ROW_BORDER_WIDTH = 0;

export const audioTrackDialogStyles = (theme) => ({
  modalWrapper: {
    position: "relative",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  blurOverlay: {
    // Absolutely fill the card so the frosted blur sits BEHIND the modal
    // content. With position:"relative" it collapsed to a zero-height sibling
    // and never covered anything, leaving the iOS card transparent so the bani
    // text bled through and collided with the modal text.
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderRadius: theme.borderRadius.md,
  },
  container: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    width: "95%",
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: theme.spacing.md_12,
    // Clip the absolutely-filled BlurView to the card's rounded corners.
    overflow: "hidden",
  },
  containerIOS: {
    // Fallback tint under the BlurView so the card is never fully see-through
    // (e.g. when reduce-transparency is enabled and the blur renders solid).
    backgroundColor: theme.c.surface,
  },
  containerAndroid: {
    // Android has no BlurView compositing over this card (that's iOS-only, see
    // above), so the 0.95-alpha transparentOverlay left the card genuinely
    // see-through — invisible over normal content but visible as a translucent
    // strip wherever it overlapped the system nav bar when not hidden. Use a
    // fully opaque surface on Android, matching the same fix already applied to
    // AudioControlBar's mainContainer for the identical reason.
    backgroundColor: theme.c.surface,
  },
  header: {
    alignItems: "center",
    zIndex: 1,
  },
  closeButton: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 10,
  },

  welcomeText: {
    fontFamily: constant.BALOO_PAAJI_SEMI_BOLD,
    fontSize: theme.typography.sizes.xxl,
    textAlign: "center",
    color: theme.c.textPrimary,
    // Reserve room on BOTH sides for the absolutely-positioned close (X) button
    // (icon 30 + right inset) so the centered title never slides under it in
    // longer translations (e.g. Italian/German) — symmetric so it stays centred
    // and works whichever side is trailing in RTL (Shahmukhi). Title wraps if a
    // translation is very long, which is preferable to overlapping the X.
    paddingHorizontal: theme.spacing.xxl,
  },
  subtitleText: {
    fontFamily: constant.BALOO_PAAJI,
    fontSize: theme.typography.sizes.lg,
    textAlign: "center",
    color: theme.c.textPrimary,
  },
  previewHintText: {
    marginTop: theme.spacing.xs,
    fontFamily: constant.BALOO_PAAJI,
    fontSize: theme.typography.sizes.md,
    textAlign: "center",
    color: theme.c.textPrimary,
    opacity: 0.85,
  },
  offlineBanner: {
    alignSelf: "stretch",
    backgroundColor: theme.c.fillSubtle,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    zIndex: 1,
  },
  offlineBannerText: {
    fontFamily: constant.BALOO_PAAJI,
    fontSize: theme.typography.sizes.md,
    textAlign: "center",
    color: theme.c.textPrimary,
    opacity: 0.9,
  },
  // Relatively positioned so the drawn scroll indicator, an absolutely
  // positioned sibling of the list, anchors to the list rather than the card.
  trackListWrapper: {
    position: "relative",
    zIndex: 1,
    // Shrinks so the card's own maxHeight is honoured by the LIST rather than
    // by clipping whatever happens to be last, which was the Next button.
    flexShrink: 1,
  },
  trackList: {
    // No fixed height. It was a flat 200pt slab that could not shrink — React
    // Native defaults flexShrink to 0 — so once the intro grew with the OS text
    // size the card went over its cap and the footer below was cut off. The
    // list now takes what is left after the pinned Next button and scrolls the
    // rest, which is the same arrangement the pothi sheets use.
    flexShrink: 1,
    zIndex: 1,
  },
  trackSectionHeader: {
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.c.textPrimary,
    opacity: 0.6,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  // Reserves a thin lane on the right so the native scroll indicator floats
  // in the gap next to each pill instead of drawing on top of it.
  trackListContent: {
    paddingRight: 6,
  },
  trackItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl_20,
    marginBottom: theme.spacing.md,
    marginRight: 2,
    minHeight: 36, // Consistent height for Android
  },
  selectedTrackItem: {
    backgroundColor: theme.c.primary,
    color: theme.c.onPrimary,
  },
  // Right-hand group of each artist row: optional offline tick + play/stop icon.
  trackItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flexShrink: 0,
  },
  trackName: {
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.normal,
    flex: 1,
  },
  selectedTrackName: {
    color: theme.c.onPrimary,
  },
  // Offline + not downloaded: greyed and non-interactive.
  trackItemDisabled: {
    opacity: 0.4,
  },
  // Footer row holds the Next/Play button, pinned to the bottom-right corner.
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  playButton: {
    backgroundColor: theme.c.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md_12,
    paddingHorizontal: theme.spacing.xl,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    // Fixed width so the button does not resize when the countdown text
    // changes (e.g. "Next (30s)" → "Next (9s)" drops a character).
    minWidth: 150,
    zIndex: 1,
    overflow: "hidden",
  },
  playButtonText: {
    color: theme.c.onPrimary,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    marginRight: theme.spacing.md,
    fontFamily: theme.typography.fonts.balooPaaji,
    fontVariant: ["tabular-nums"],
  },
  nextLoadingSpinner: {
    marginRight: theme.spacing.sm,
  },
  playButtonDisabled: {
    opacity: 0.5,
  },
  // The 15s preview countdown, drawn across the artist row it belongs to
  // rather than on the Next button — on the button it read as "Next is
  // loading and will advance on its own", which is not what happens.
  // Clipping lives on this wrapper, not on the row, so only the fill is
  // masked: overflow + borderRadius on the row itself makes Android shave
  // the icons inside it.
  previewSweepTrack: {
    position: "absolute",
    // Absolutely positioned children are laid out INSIDE the parent's border,
    // so 0 insets leave the row's border uncovered as a hairline gap along the
    // sweep's edge. It also makes this box 2px shorter than the row, and since
    // the pill radius clamps to height/2 the two corner curves then disagree.
    // Pulling out by the border width fixes both.
    top: -TRACK_ROW_BORDER_WIDTH,
    left: -TRACK_ROW_BORDER_WIDTH,
    right: -TRACK_ROW_BORDER_WIDTH,
    bottom: -TRACK_ROW_BORDER_WIDTH,
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
  },
  // Translucent white over the selected row's navy (colors.primary, the same
  // value in both themes), so it lightens the row without hiding the artist
  // name that sits on top of it.
  previewSweepFill: {
    height: "100%",
    backgroundColor: withAlpha(theme.c.onPrimary, 0.22),
  },
});

export const downloadBadgeStyles = (theme) => ({
  container: {
    position: "relative",
    zIndex: 10,
    bottom: 0,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    marginRight: theme.spacing.xl_20,
    backgroundColor: theme.c.border,
    // Size to the content (icon + label) instead of a fixed 35%, so longer
    // localized strings ("Téléchargement en cours", etc.) don't overflow.
    // maxWidth keeps it from spanning the whole player on small screens.
    maxWidth: "90%",
    alignSelf: "flex-end",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: 3,
    paddingHorizontal: theme.spacing.md_12,
  },
  downloadedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  downloadButtonText: {
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.light,
    color: theme.c.headerFg,
    flexShrink: 1,
    minWidth: 0,
  },
});

// Vertical space the collapsed pill occupies: its own height plus the gap it
// keeps from the bottom of the screen. Collapsed, the pill holds only the
// circle, so it rests on the container's minimum and this number stays exact
// for the state it describes. It is absolutely positioned, so it contributes
// nothing to its parent's layout, and anything that needs to sit clear of it
// (see setToastBottomReservation) has to be told the number.
export const MINIMIZED_PLAYER_FOOTPRINT = 54;

export const minimizePlayerStyles = (theme) => ({
  container: {
    position: "absolute",
    bottom: 10,
    right: theme.spacing.xl_20,
    // A FLOOR, not a fixed height. Circle (28px) + paddingVertical*2 (8px) =
    // 36px; 44 gives a comfortable touch target with a small visual top/bottom
    // margin, and the collapsed pill — holding only the circle — still settles
    // at exactly 44 and stays round.
    //
    // It cannot stay a fixed height: the two lines below hand iOS no lineHeight
    // (see @theme/lineHeight), so there they are drawn in Baloo's own 1.771em
    // box and the pair measures ~44.5 instead of the 28.5 the pinned boxes
    // gave. Against a fixed 44 that overflowed a pill whose text wrap carries
    // `overflow: hidden` — the clipping this was meant to prevent. Sizing to
    // content is also what carries the pill through the OS text-size setting
    // rather than cutting the text off at large sizes.
    minHeight: 44,
    // The pill sizes to its content, so a short artist name never leaves a gap
    // and a normal-length one ("Bibi Indermohan Kaur") still shows in FULL — no
    // truncation. It is not unbounded, though: MinimizePlayer caps the text panel
    // to the viewport (maxTextWidth), so a long name on a narrow device can no
    // longer push the pill off-screen. The drag-release clamp handles position.
    borderRadius: theme.borderRadius.xl,
    // Symmetric horizontal padding only — this keeps the COLLAPSED pill a perfect
    // 44x44 circle (28 icon + 8+8). The right breathing room after the artist name
    // lives on textContainer so it doesn't deform the collapsed circle.
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.c.surface,
    ...theme.elevation.raised,
  },
  progressContainer: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  playPauseButton: {
    position: "absolute",
    zIndex: 1,
  },
  svgContainer: {
    position: "absolute",
  },
  textWrap: {
    overflow: "hidden",
    flexShrink: 1,
  },
  textContainer: {
    justifyContent: "center",
    // Gap between the play/pause circle and the artist/duration text. Reduced
    // ~40% from md_12 (12) to tighten the pill without changing its size.
    paddingLeft: 7,
    // Right breathing room after the artist name (only present when expanded, so
    // the collapsed circle stays a circle). With the container's md right pad this
    // gives the same ~12px gap, just without widening the collapsed pill.
    paddingRight: theme.spacing.sm,
  },
  // The two lines of the collapsed pill.
  //
  // Their line heights are ANDROID's alone. At 14 on a 12pt face and 16 on a
  // 14pt one they sit well under Baloo's 1.771em box, and iOS answers that by
  // dropping the baseline to `lineHeight - descent` and taking every missing
  // point off the ascent: the duration's digits started 2pt above the top of
  // their own line and were sliced, and the reciter's capitals with them. On
  // iOS both are now drawn in the face's own metrics — see @theme/lineHeight,
  // and the container's minHeight, which is what gives the taller pair room.
  //
  // includeFontPadding:false on BOTH lines is load-bearing, not cosmetic. Android
  // otherwise reserves extra ascent/descent padding inside each Text; with the
  // tight lineHeights below that padding is proportionally large and asymmetric,
  // so the glyphs sit off-centre inside their own line box. The pill's
  // alignItems:"center" then centres the BOX correctly while the visible text
  // still looks pushed up/down — which is exactly the "not vertically centred"
  // bug. Stripping the font padding makes the line box hug the glyphs, so
  // centring the box centres what you actually see. (Same fix as the Seva
  // amount's currency/amountDisplay.)
  timestamp: {
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: theme.typography.sizes.sm,
    // Tight line box (≈ font size) strips the font's bottom leading, which is the
    // main source of the gap down to the artist name below.
    lineHeight: androidLineHeight(theme.typography.sizes.sm + 2),
    color: theme.c.textPrimary,
    opacity: 0.7,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  artistName: {
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: theme.typography.sizes.md,
    // Tight line box, pulled up so the two lines read as one block. The negative
    // margin was -3.5, which closed the gap entirely and made the timestamp and
    // the name look stuck together; -1.5 gives back ~2px of breathing room
    // without letting the pair drift apart. Do not push this below ~-2 again.
    lineHeight: androidLineHeight(theme.typography.sizes.md + 2),
    color: theme.c.textPrimary,
    marginTop: -1.5,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});

export const audioSettingModalStyles = (theme) => ({
  settingsModalContainer: {
    width: "95%",
    marginLeft: "auto",
    marginRight: "auto",
    backgroundColor: theme.c.surface,
    padding: theme.spacing.md,
  },
  settingItemTitle: {
    flex: 1,
    marginRight: theme.spacing.md,
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.fonts.balooPaaji,
    // A row's LABEL, so it takes the same near-black/near-white every other
    // label in the app uses. It read as `textSecondary` grey, which made these
    // rows look disabled beside the identical rows on the Settings screen.
    // Only the value and the helper line below stay secondary, matching how a
    // Settings row weights its title against its value.
    color: theme.c.textPrimary,
  },
  settingValueText: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.fonts.balooPaaji,
    color: theme.c.textSecondary,
  },
  switchStyle: Platform.select({
    android: { transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] },
    ios: { transform: [{ scaleX: 1.0 }, { scaleY: 1.0 }] },
  }),
  speedControlContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
  },
  speedControlButton: {
    minWidth: 44,
    // 30 matches ThemedSwitch's track height so the playback-speed row is the
    // same height as the Auto Play / Sync Scroll rows. The 24px +/- icons fit,
    // and the Pressable's hitSlop keeps the tap target comfortable.
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  modalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // Vertical-only spacing — the container already pads the horizontal edges,
    // so the previous all-sides margin was doubling the side padding.
    marginVertical: theme.spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: theme.c.border,
  },
  settingHelperText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fonts.balooPaaji,
    color: theme.c.textSecondary,
  },
  settingHelperTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
});

export default createStyles;
