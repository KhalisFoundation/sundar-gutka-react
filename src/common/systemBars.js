import { useEffect, useRef } from "react";
import { NativeModules, Platform } from "react-native";
import { relativeLuminance } from "@theme/reader/contrast";

// Which way round the system navigation bar's glyphs are drawn.
//
// The app runs edge-to-edge and the platform's contrast scrim is off
// everywhere (MainActivity, SplashActivity, values-v29/styles.xml), so the
// app's own pixels reach the bottom of the display. That leaves legibility to
// the glyphs: dark over a light surface, light over a dark one.
//
// The scrim cannot do this job. It is ~80% opacity tinted from the window, so
// over the Reader's white page it lands light grey — and the platform's white
// glyphs on light grey is the unreadable combination it was supposed to
// prevent.
//
// A screen declares what is behind the bar while it is on screen. Claims are
// ordered, and the most recent wins: a screen pushed over another decides for
// as long as it is there, then hands back. A screen whose bottom edge is not
// its own — a hidden tab bar — registers NOTHING rather than a value, which is
// what keeps it from overruling the screen actually in front of the user.

const { SystemBars } = NativeModules;

const supported =
  Platform.OS === "android" && typeof SystemBars?.setNavigationBarLightGlyphs === "function";

// Active claims in registration order; the last is the one in front.
const claims = [];
// What the native side was last told, so an unchanged answer costs no bridge
// call. Null until the first one.
let applied = null;

const resolved = () => {
  const top = claims[claims.length - 1];
  // Nothing claimed: leave the glyphs as they are rather than guessing at a
  // surface nobody has described.
  return top ? top.light : null;
};

const apply = () => {
  if (!supported) return;
  const light = resolved();
  if (light === null || light === applied) return;
  applied = light;
  SystemBars.setNavigationBarLightGlyphs(light);
};

/** Test seam: forget every claim and the last value sent. */
export const resetNavBarGlyphs = () => {
  claims.length = 0;
  applied = null;
};

// The luminance at which the platform's near-black glyphs start reading better
// than its white ones. Derived, not chosen: WCAG contrast against black is
// (L + 0.05) / 0.05 and against white is 1.05 / (L + 0.05), so they are equal
// where (L + 0.05)^2 = 0.05 * 1.05. Everything above this wants dark glyphs.
const GLYPH_CROSSOVER = Math.sqrt(0.05 * 1.05) - 0.05;

/**
 * Which way round the glyphs should be drawn over `color`.
 *
 * The platform gives one boolean, so the real choice is between its near-black
 * glyphs and its white ones. Rather than guess from whether a theme calls
 * itself dark, measure: whichever of the two actually contrasts better against
 * the surface wins. That is what keeps a mid-tone ground - the case where the
 * glyphs and the background are nearly the same lightness, and the buttons
 * disappear - from resolving to the invisible option.
 *
 * @returns {boolean|null} true for dark glyphs (a light surface), false for
 *   light ones, null when the colour cannot be read.
 */
export const glyphsForSurface = (color) => {
  const luminance = relativeLuminance(color);
  if (luminance === null) return null;
  return luminance >= GLYPH_CROSSOVER;
};

/** Whether the glyphs would currently be dark (i.e. a light surface), or null. */
export const navBarGlyphsAreDark = () => resolved();

/**
 * Declares the surface behind the system navigation bar for as long as this
 * screen is on it.
 *
 * @param {boolean|null} light true when that surface is light, so the glyphs
 *   go dark. Null (or undefined) to claim nothing — for a bar that is mounted
 *   but hidden, which must not speak for the screen in front of it.
 */
export const useNavBarSurface = (light) => {
  const entry = useRef({ light });

  useEffect(() => {
    if (light === null || light === undefined) {
      const at = claims.indexOf(entry.current);
      if (at !== -1) claims.splice(at, 1);
      apply();
      return undefined;
    }
    const claim = entry.current;
    claim.light = light;
    const at = claims.indexOf(claim);
    if (at !== -1) claims.splice(at, 1);
    claims.push(claim);
    apply();
    return () => {
      const gone = claims.indexOf(claim);
      if (gone !== -1) claims.splice(gone, 1);
      apply();
    };
  }, [light]);
};

export default useNavBarSurface;
