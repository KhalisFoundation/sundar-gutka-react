import React, { useContext, useRef, useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import PropTypes from "prop-types";
// The commonjs build: the package's default entry is ESM, which jest cannot
// transform and Metro would have to be told about.
import { appendGurmukhi, canAppend } from "../../gurmukhiInput";
import { KEY_PAGES } from "../../gurmukhiKeys";
import useTokens from "../../hooks/useTokens";
import SheetKeyboardSpace from "./sheetKeyboardSpace";
import Text from "./Text";

// An on-screen Punjabi keyboard.
//
// ── The layout is not ours ────────────────────────────────────────────────
// It comes from `simple-keyboard-layouts` (MIT), the layout set behind
// react-simple-keyboard: the standard InScript Punjabi arrangement, the same
// one Android and iOS ship, so anyone who already types Punjabi recognises the
// key positions. Only the RENDERER is ours — that package draws to the DOM.
//
// ── Why it is full-bleed ──────────────────────────────────────────────────
// InScript is a DESKTOP layout: twelve keys on the widest row. Inside the
// sheet's 16pt padding, with a border and 4pt padding on every key, each key
// came out around 25pt wide — thin, hard to hit, and overflowing the row. A
// real phone keyboard solves this the only way it can: span the full width,
// drop the per-key borders, use hairline gaps. So this cancels the sheet's
// padding with a negative margin and does the same.
//
// At 390pt that gives (390 - 8 edge - 33 gaps) / 12 ≈ 29pt wide by 44pt tall —
// a real tap target, in the proportions phone keyboards actually use.
//
// ── The rules are enforced ────────────────────────────────────────────────
// `canAppend` (see common/gurmukhiInput) decides whether a key may follow what
// is already typed — it is what stops "ਅਨੀਾਾਿਿੀੁੁ". A key that cannot is
// DISABLED and dimmed rather than hidden, so the layout never reshuffles under
// the user's finger.
//
// ── Two pages, like a phone keyboard ──────────────────────────────────────
// All 65 keys on one page made eight rows, over half the screen, and left a
// sheet's list with no room. So the letters get a page of their own and the
// matras, vowels, nukta letters and marks are one tap away — see KEY_PAGES.
//
// The switch works the way shift does on Gboard. One tap shows the second
// page for ONE character and then returns to the letters, because Gurmukhi
// alternates: a letter, its matra, the next letter. A double tap locks the
// second page for a run of marks; tapping it again unlocks. Backspace does
// not use the tap up.

const BKSP = "{bksp}";
const SPACE = "{space}";
const SWITCH = "{switch}";
const LABELS = { [BKSP]: "⌫", [SPACE]: "␣" };

const LETTERS = 0;
const SIGNS = 1;
/** The switch shows the page it goes TO, in that page's own characters. */
const SWITCH_LABEL = { [LETTERS]: "ਾ ਿ", [SIGNS]: "ਕ ਖ" };

/** Under both pages: the switch, space and backspace. */
const CONTROLS = [SWITCH, SPACE, BKSP];
/** How much of the row each control takes, in key widths out of ten. */
const CONTROL_WIDTH = { [SWITCH]: 2, [SPACE]: 6, [BKSP]: 2 };

/** The taller page sets the height of both, so switching never moves the sheet. */
const KEY_ROW_COUNT = Math.max(...KEY_PAGES.map((page) => page.length));
/** Key rows plus the controls row. */
const ROW_COUNT = KEY_ROW_COUNT + 1;

/** Two taps on the switch this close together lock the second page. */
const DOUBLE_TAP_MS = 300;
/** Gaps and edge inset, in points. Deliberately tight — see the note above. */
const GAP = 3;
const EDGE = 4;

// ── Why the keys do NOT grow with the text-size setting ────────────────────
// A key's height came from `layout.touchTarget`, which scales at the full font
// rate: 44pt becomes 66pt at the 1.5x cap. Across seven rows that is 460pt of
// keys before gaps, and the keyboard is a PINNED sheet footer — it takes its
// height before the body gets any. So the sheet showed its title and a sliver
// of the name field, with the field itself and both buttons clipped away
// entirely, on the one screen whose whole job is typing a name.
//
// Raising the text size must make the GLYPHS bigger, not push the field being
// typed into off the screen. Both platforms' own keyboards work this way: key
// height is a share of the display and holds steady as text size changes.
//
/** The most of the window the keys may take, gaps and plate included. */
const MAX_WINDOW_SHARE = 0.55;
/**
 * The floor, for a short screen. Below `layout.touchTarget` on purpose: these
 * keys are already only ~29pt WIDE (twelve to a row is what InScript needs),
 * so height was never the binding constraint on the target. 34x29 clears the
 * 24x24 minimum in WCAG 2.5.8.
 */
const MIN_KEY_HEIGHT = 34;

const GurmukhiKeyboard = ({ value, onChange, lettersLabel, signsLabel }) => {
  const { c, radii, layout, theme } = useTokens();
  const { height } = useWindowDimensions();
  // What the sheet it is pinned in has left once its title, field, buttons and
  // list are placed. A share of the window alone was not enough: at a large
  // display or text size those grow, and a keyboard sized only to the window
  // left the list no room and ran its last row behind the navigation bar.
  const sheetSpace = useContext(SheetKeyboardSpace);
  const room = Math.min(height * MAX_WINDOW_SHARE, sheetSpace ?? Infinity);
  const [page, setPage] = useState(LETTERS);
  const [locked, setLocked] = useState(false);
  const lastSwitch = useRef(0);

  // UNSCALED tokens throughout the plate, deliberately. `layout.touchTarget`
  // and `space.*` from useTokens are already multiplied by the OS text scale,
  // and scaling is the very thing being avoided: were the padding to grow with
  // the text size it would eat the budget below and the keys would shrink to
  // pay for it, which is font-scale dependence by another route.
  const pad = theme.space.md;
  const clearance = theme.space.lg;
  const baseKeyHeight = theme.layout.touchTarget;
  // Everything in the plate that is not a key: its own padding, the gaps
  // between rows, and the margin clearing whatever sits above it.
  const plateChrome = pad * 2 + clearance + GAP * (ROW_COUNT - 1);
  const keyHeight = Math.max(
    MIN_KEY_HEIGHT,
    Math.min(baseKeyHeight, Math.floor((room - plateChrome) / ROW_COUNT))
  );

  const keyRows = KEY_PAGES[page];
  // The switch is read out as the page it opens, in words: what it shows is
  // only characters.
  const switchName = page === LETTERS ? signsLabel : lettersLabel;
  // A page with fewer rows spreads them over the same height as the taller
  // one, rather than leaving a gap or shrinking the keyboard under the finger.
  const keyArea = keyHeight * KEY_ROW_COUNT + GAP * (KEY_ROW_COUNT - 1);
  const keyRowHeight = (keyArea - GAP * (keyRows.length - 1)) / keyRows.length;

  const toSwitch = () => {
    const now = Date.now();
    const doubleTap = now - lastSwitch.current < DOUBLE_TAP_MS;
    lastSwitch.current = now;
    // The second tap of a double tap arrives on the page the first one
    // opened, so it locks that page instead of leaving it.
    if (page === SIGNS && doubleTap && !locked) {
      setLocked(true);
      return;
    }
    setLocked(false);
    setPage(page === LETTERS ? SIGNS : LETTERS);
  };

  const press = (key) => {
    if (key === SWITCH) {
      toSwitch();
      return;
    }
    if (key === BKSP) {
      onChange(value.slice(0, -1));
      return;
    }
    // The whole next text, not the key: a matra can turn the letter before it
    // into a different one (ਅ + ਾ is ਆ), which appending alone cannot express.
    const chars = key === SPACE ? [" "] : [...key];
    onChange(chars.reduce(appendGurmukhi, value));
    // One character, then back to the letters — unless the page is locked.
    if (page === SIGNS && !locked) setPage(LETTERS);
  };

  // A multi-codepoint key (base + nukta) is checked one codepoint at a time,
  // against the text as it grows — otherwise the nukta half would be judged
  // against the wrong preceding character.
  const allowed = (key) => {
    if (key === BKSP || key === SWITCH) return true;
    const chars = key === SPACE ? [" "] : [...key];
    let text = value;
    return chars.every((ch) => {
      if (!canAppend(text, ch)) return false;
      text = appendGurmukhi(text, ch);
      return true;
    });
  };

  return (
    <View
      style={{
        // Cancels the sheet's own horizontal padding so the keys get the full
        // width. Without this there is not room for twelve of them.
        marginHorizontal: -layout.sheet.paddingHorizontal,
        // Clears whatever sits above it. Pinned as a sheet footer it is flush
        // against the last control otherwise, so the Done button and the top
        // row of keys read as one block.
        marginTop: clearance,
        paddingHorizontal: EDGE,
        paddingVertical: pad,
        gap: GAP,
        // A keyboard is a RECESSED plate with RAISED keys on it — the plate has
        // to sit behind both the sheet and the keys. `fillSubtle` was used here
        // and gets that backwards in dark mode: it resolves LIGHTER than
        // `surface`, so the plate glowed and the keys sank into it. Reading the
        // ground role instead keeps plate < key < pressed in every theme, the
        // same ordering the Reader's audio panels use.
        backgroundColor: c.backgroundAlt,
        borderTopWidth: layout.borderWidth.hairline,
        borderTopColor: c.border,
      }}
    >
      {[...keyRows, CONTROLS].map((row, rowIndex) => (
        // eslint-disable-next-line react/no-array-index-key
        <View key={`row-${rowIndex}`} style={{ flexDirection: "row", gap: GAP }}>
          {row.map((key, keyIndex) => {
            const on = allowed(key);
            const isSwitch = key === SWITCH;
            // Lit while the second page is up; outlined once it is locked there.
            const switchLit = isSwitch && page === SIGNS;
            const fill = (pressed) => {
              if (pressed) return c.surfaceSelected;
              return switchLit ? c.accentSubtle : c.surface;
            };
            return (
              <Pressable
                // eslint-disable-next-line react/no-array-index-key
                key={`${key}-${keyIndex}`}
                onPress={() => press(key)}
                disabled={!on}
                accessibilityRole="button"
                accessibilityState={isSwitch ? { selected: switchLit } : { disabled: !on }}
                accessibilityLabel={isSwitch ? switchName : LABELS[key] ?? key}
                style={({ pressed }) => ({
                  // The controls take several keys' width, as on any keyboard.
                  flex: CONTROL_WIDTH[key] ?? 1,
                  alignItems: "center",
                  justifyContent: "center",
                  // Tall enough to hit; the WIDTH is what the row divides up.
                  // A height, not a minimum: a minimum would let the glyph grow
                  // the key back with the text size, which is what this exists
                  // to stop. The glyph itself still scales and wraps to one
                  // line inside it.
                  height: rowIndex < keyRows.length ? keyRowHeight : keyHeight,
                  // No horizontal padding: at twelve keys to a row it is width
                  // this cannot spare. The hairline IS affordable and earns its
                  // place — it keeps the keys legible in a theme whose `surface`
                  // and `backgroundAlt` sit close together.
                  paddingHorizontal: 0,
                  borderRadius: radii.sm,
                  borderWidth: switchLit && locked ? 2 : layout.borderWidth.hairline,
                  borderColor: switchLit ? c.accent : c.border,
                  backgroundColor: fill(pressed),
                  opacity: on ? 1 : 0.3,
                })}
              >
                <Text
                  variant="body"
                  align="center"
                  color={switchLit ? "accent" : "textPrimary"}
                  numberOfLines={1}
                >
                  {isSwitch ? SWITCH_LABEL[page] : LABELS[key] ?? key}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

GurmukhiKeyboard.propTypes = {
  /** What is already typed — the rules are relative to it. */
  value: PropTypes.string.isRequired,
  /**
   * Called with the whole next text. Not the key alone: a matra can replace the
   * letter before it with the vowel letter the two spell (ਅ + ਾ is ਆ).
   */
  onChange: PropTypes.func.isRequired,
  /** Spoken name of the switch when it goes back to the letters. */
  lettersLabel: PropTypes.string.isRequired,
  /** Spoken name of the switch when it opens the matras and signs. */
  signsLabel: PropTypes.string.isRequired,
};

export default GurmukhiKeyboard;
