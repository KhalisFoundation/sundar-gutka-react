import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Platform,
  Pressable,
  TextInput,
  Animated,
  Linking,
  Text,
  useWindowDimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { FONT_SCALE_MAX } from "@theme/scale";
import { paletteFor, themeForScreen } from "@theme/screenPalettes";
import PropTypes from "prop-types";
import { ScreenHeader, Spinner } from "@common/components/ui";
import {
  SafeArea,
  StatusBarComponent,
  CustomText,
  GradientDivider,
  useTheme,
  useThemedStyles,
  STRINGS,
  openInAppBrowser,
  trackSevaEvent,
  useCustomScrollbar,
} from "@common";
import {
  DonateIcon,
  CloseIcon,
  ChevronRight,
  HandHeartIcon,
  MegaphoneIcon,
  CodeIcon,
  ClipboardCheckIcon,
  ExternalLinkIcon,
  StarIcon,
} from "../common/icons";
import {
  resolveCurrency,
  usdToLocal,
  localToUsd,
  minLocalAmount,
  formatCurrency,
  formatNumber,
  resolveLocalPresets,
} from "../services/currency";
import { initExchangeRates } from "../services/exchangeRates";
import { getSevaConfig, buildQgivUrl, markSevaSeen } from "../services/sevaConfig";
import { prewarmSevaMeans } from "../services/sevaMeans";
import createStyles from "./styles";
import { parseHtmlBlocks, blockText } from "./utils/parseHtmlBlocks";

// ─── Seva analytics funnel helpers (in-app, observable steps only) ───────────
// donation_type is required on every Seva event and must never be null/empty.
const donationTypeOf = (freq) => (freq === "One Time" ? "one_time" : "recurring");

// amount_bucket is always a non-empty categorical string (never null) so Firebase
// never records "(not set)". The three presets (10/50/100) fall in distinct
// buckets, and a not-yet-typed custom amount is reported as "custom".
const bucketAmount = (amount) => {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return "unknown";
  if (n < 10) return "under_10";
  if (n < 25) return "10_24";
  if (n < 50) return "25_49";
  if (n < 100) return "50_99";
  if (n < 250) return "100_249";
  return "250_plus";
};

// Observable in-app funnel steps. The furthest reached is emitted on exit as
// checkout_abandoned.last_step_reached when the user leaves before the handoff.
const SEVA_STEPS = {
  landing_view: 1,
  donation_type_selected: 2,
  amount_selected: 3,
  payment_started: 4,
};
const SEVA_STEP_NAMES = Object.keys(SEVA_STEPS);
const stepNameOf = (v) => SEVA_STEP_NAMES[v - 1] || "landing_view";

// "Other ways to do Seva" list items: each server-driven means link
// (`seva-means:<page>`) maps to a native icon + accent tint. The app supplies
// the icon/colour/navigation chrome; the backend supplies the text + order.
const MEANS_META = {
  // One hue per means — indigo / teal / green / gold. They are fixed in both
  // themes: the hue is what tells the rows apart, so it is not a role. The
  // values live in the Seva palette, keyed by these same page names.
  social: { Icon: MegaphoneIcon },
  coding: { Icon: CodeIcon },
  qa: { Icon: ClipboardCheckIcon },
  other: { Icon: StarIcon },
};

/** Half-period of the caret blink, matching a native text cursor. */
const BLINK_MS = 450;

// A blinking text cursor for the custom-amount inline display (the real
// TextInput is hidden — see the amount card — so the ₹ symbol and the digits
// can be rendered as one baseline-aligned inline Text).
//
// It toggles the glyph's COLOUR on an interval rather than animating opacity,
// and that is load-bearing. This caret is an inline span inside the figure's
// `CustomText` → `ui/Text` → RN `Text`, and React Native flattens nested text
// into a VIRTUAL node with no backing native view. An `Animated` opacity loop
// with `useNativeDriver: true` therefore has nothing to attach to: it ran
// happily and changed nothing, so the caret rendered permanently solid instead
// of blinking. Colour is a text attribute, so it does apply to a virtual span.
//
// Toggling to "transparent" rather than swapping the character out keeps the
// glyph's advance width constant, so the digits beside it do not jitter.
//
// No fontFamily: "sans-serif" is an ANDROID family name — on iOS it is not a
// real family and RN logs "Unrecognized font family" before falling back. A
// bar needs no particular face, so it inherits the figure's.
const BlinkingCursor = ({ color, fontSize }) => {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn((visible) => !visible), BLINK_MS);
    return () => clearInterval(id);
  }, []);
  return <Text style={{ color: on ? color : "transparent", fontSize }}>|</Text>;
};

BlinkingCursor.propTypes = {
  color: PropTypes.string.isRequired,
  fontSize: PropTypes.number.isRequired,
};

const SevaScreen = () => {
  const { theme } = useTheme();
  // Seva's own colours, through the same role names — see theme/screenPalettes.
  const { c } = themeForScreen(theme, "seva");
  const palette = paletteFor("seva", theme);
  const isDarkMode = theme.mode === "dark";
  const styles = useThemedStyles(createStyles);
  // The app-wide themed scrollbar, not the unthemed native one.
  const { scrollViewProps, Indicator } = useCustomScrollbar();
  const { width: screenWidth, height: screenHeight, fontScale } = useWindowDimensions();
  // Past this the frequency pair stops sharing a line — see the control below
  // and `frequencyContainerStacked`. The same threshold the shared list Row
  // uses for its own title/value pair, so the two read alike at a given size.
  const stackFrequency = fontScale >= 1.3;

  // ─── Responsive metrics ─────────────────────────────────────────────────────
  // Every size below is derived from the viewport and then CLAMPED, so the page
  // scales smoothly between a small phone and a tablet instead of flipping
  // between layouts.
  const hPad = Math.round(Math.max(16, Math.min(28, screenWidth * 0.064)));
  // Fixed vertical rhythm between sections — replaces the old space-between,
  // which stretched/collapsed the gaps depending on the device height.
  const gap = Math.round(Math.min(24, Math.max(14, screenHeight * 0.02)));
  const vPad = Math.round(Math.min(36, Math.max(18, screenHeight * 0.04)));
  // The big amount is bound by height as well as width, so a short device gets a
  // smaller figure instead of one that squeezes out everything else. Capped
  // lower than before so the amount BOX is shorter (per SIO-155), and so a large
  // localised figure (e.g. ₹10,000) plus the inline "/month" still fits one row.
  const amountFontSize = Math.round(
    Math.min(52, Math.max(34, Math.min(screenWidth * 0.13, screenHeight * 0.062)))
  );
  // The line box the amount is drawn in, and it has to satisfy two things.
  //
  // 1.12 is tighter than the glyphs are tall. Android pads the box and draws
  // the overflow; iOS clips to it exactly, and the rupee symbol — the system
  // face, taller than the Baloo digits beside it — lost its top. iOS gets the
  // room; Android keeps the height this screen was laid out against, where the
  // amount box is deliberately short.
  //
  // And it SCALES with the text. React Native grows `fontSize` with the OS
  // text setting but leaves an explicit `lineHeight` exactly as written, so a
  // pinned box stops fitting the moment someone turns their text up — on
  // either platform. Clamped where ui/Text clamps it, so the two agree.
  const amountLineHeight = Math.round(
    amountFontSize * (Platform.OS === "ios" ? 1.3 : 1.12) * Math.min(fontScale || 1, FONT_SCALE_MAX)
  );
  const navigation = useNavigation();

  const language = useSelector((state) => state.language);

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(false);

  // Donor currency (symbol + display-figure conversion). Prefers the backend's
  // IP-resolved countryCode (config?.countryCode) once the config has loaded;
  // falls back to the device locale before that (first render, offline, or
  // when the backend sent no country header) — resolveCurrency(undefined)
  // does exactly that internally. Recomputed every render, so this updates
  // automatically the moment `config` lands. The charge itself is always USD
  // via Qgiv — see services/currency.js. MUST stay below the `config` useState
  // above — it was previously placed before it, silently reading `config` as
  // undefined on every render (the useState call hadn't executed yet in that
  // render pass), so it always fell back to the device locale regardless of
  // what the backend actually sent.
  const currency = resolveCurrency(config?.countryCode);
  // Digits ALWAYS render in Baloo Paaji. Only the currency SYMBOL may need a
  // different font: Baloo can't draw ₹ correctly, so INR's symbol uses the
  // system font; every other currency's symbol stays Baloo (they render fine).
  // Symbol + digits are rendered as inline text spans (see the amount card), so
  // they share one baseline and align regardless of the symbol's font.
  const symbolFontFamily =
    currency.code === "INR" ? "sans-serif" : theme.typography.fonts.balooPaaji;
  // The system-font ₹ renders TALLER than the Baloo digits at the same size, so
  // scale the symbol DOWN to match their height. Non-INR symbols are Baloo (same
  // font as the digits) and already match → scale 1.
  const symbolFontSize = Math.round(amountFontSize * (currency.code === "INR" ? 0.82 : 1));

  const [selectedAmount, setSelectedAmount] = useState(10);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [frequency, setFrequency] = useState("Monthly");
  // Whether the hidden amount input actually holds focus — NOT the same thing
  // as `isOtherSelected`. The caret is the only visible sign the field is live
  // (the real TextInput is 1x1 and fully transparent), so it has to follow real
  // focus: the keyboard can be dismissed — hardware back, or a tap outside —
  // while `isOtherSelected` stays true, and a caret still sitting there claims
  // keystrokes will land when they will not. See focusOtherAmount below, which
  // documents the same divergence from the other side.
  const [isAmountFocused, setIsAmountFocused] = useState(false);

  // Explicit focus for the "Other" amount input — see the effect below.
  const otherAmountInputRef = useRef(null);

  // Prevents concurrent open() calls (guards iOS where open() may not resolve on background)
  const isBrowserOpenRef = useRef(false);

  // ─── Analytics funnel (intent only) ────────────────────────────────────────
  // These measure in-app funnel behaviour. Actual payment truth lives on Qgiv —
  // we cannot observe completion from here, so "donate_tapped"/"payment_success"
  // represent intent, not confirmed donations.
  const hasDonatedRef = useRef(false);
  const hasInteractedRef = useRef(false);
  const lastFrequencyRef = useRef(frequency);
  // Furthest funnel step reached — emitted as checkout_abandoned.last_step_reached
  // on exit. Starts at landing_view (the screen is on screen as of mount).
  const maxStepRef = useRef(SEVA_STEPS.landing_view);
  const markStep = useCallback((name) => {
    const v = SEVA_STEPS[name] || 0;
    if (v > maxStepRef.current) maxStepRef.current = v;
  }, []);

  // Prewarm all four "Seva by other means" pages for the current language so a
  // single online visit to Seva caches every sub-page for later offline use.
  useEffect(() => {
    prewarmSevaMeans({ lang: language }).catch(() => {});
  }, [language]);

  // Sync the Seva config on EVERY open (screen focus) and on language change:
  //   • Online → re-fetches the latest Seva page from the server every time it's
  //     opened, so a returning online user always sees current content.
  //   • Offline, returning user → resolves to the LAST cached (last successfully
  //     synced) Seva page.
  //   • Offline, brand-new user → resolves to the bundled fallback.
  // getSevaConfig implements that network → cache → bundled chain and never
  // throws. The loading spinner shows ONLY on the very first load; every re-open
  // refreshes SILENTLY in the background so the currently-shown page never
  // blanks while it revalidates. markSevaSeen() runs on every focus so the tab's
  // version dot clears the moment the page is opened.
  const hasLoadedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const isFirstLoad = !hasLoadedRef.current;
      (async () => {
        try {
          if (isFirstLoad) {
            setLoading(true);
            setError(false);
          }
          // Warm live FX rates (from cache — fast) before resolving the config,
          // so the very first render's donation tiers + default are already in
          // real, correctly-converted local figures (no fallback-then-swap
          // flicker). The daily network refresh it triggers is fire-and-forget.
          await initExchangeRates();
          const cfg = await getSevaConfig(language);
          if (!active) return;
          setConfig(cfg);
          if (isFirstLoad) {
            // Resolve currency FRESH from cfg?.countryCode here rather than
            // using the outer `currency` — that outer value was captured when
            // this effect closure was created (mount time, before cfg existed)
            // and does not reflect the countryCode that just arrived in cfg.
            // Using the stale value would default-select an amount in the
            // wrong currency's ladder for one render, until the next re-render
            // silently swapped the displayed symbol out from under it.
            const effectiveCurrency = resolveCurrency(cfg?.countryCode);
            // Default to the first tier of the resolved LOCAL ladder — backend
            // per-currency override, else the currency's built-in ladder (INR),
            // else the backend USD base amounts converted to local. Only on the
            // first load, so a background re-sync never resets a user's pick.
            const [defaultLocal] = resolveLocalPresets(
              effectiveCurrency,
              cfg?.amounts,
              cfg?.amountPresets
            );
            setSelectedAmount(defaultLocal ?? usdToLocal(10, effectiveCurrency));
          }
          hasLoadedRef.current = true;
          markSevaSeen();
        } catch (err) {
          if (active && isFirstLoad) setError(true);
        } finally {
          if (active && isFirstLoad) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language])
  );

  // Exposure on arrival; abandonment on leaving if the user never tapped donate.
  // Also tracks whether this is the user's first time opening the Seva screen
  // (persisted via AsyncStorage) and the donation type in effect at each end.
  //
  // Keyed on FOCUS, not on mount. Seva is a tab, and React Navigation does not
  // unmount a tab you navigate away from — so a mount-scoped funnel fired
  // `opened` once for the whole app session and reached its cleanup, the only
  // place `checkout_abandoned` came from, just about never. Every visit after
  // the first went unrecorded.
  useFocusEffect(
    useCallback(() => {
      // A visit is the unit of the funnel, so everything the previous visit
      // accumulated is cleared here. Left standing, one donation would suppress
      // `checkout_abandoned` for the rest of the session, and `last_step_reached`
      // would report the furthest step of any earlier visit.
      hasDonatedRef.current = false;
      hasInteractedRef.current = false;
      maxStepRef.current = SEVA_STEPS.landing_view;

      let onScreen = true;
      const STORAGE_KEY = "@seva_screen_opened";
      (async () => {
        let isFirstOpen = false;
        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          if (stored === null) {
            isFirstOpen = true;
            await AsyncStorage.setItem(STORAGE_KEY, "1");
          }
        } catch (_) {
          // Non-critical — analytics fires without the flag if storage fails.
        }
        // The read is async, so a user who left again first would otherwise have
        // the visit reported after they had already gone.
        if (!onScreen) return;
        trackSevaEvent("opened", {
          is_first_open: isFirstOpen,
          donation_type: donationTypeOf(lastFrequencyRef.current),
        });
      })();

      return () => {
        onScreen = false;
        // Abandoned only if the user left before the Qgiv handoff. last_step_reached
        // and donation_type are always real, non-empty values.
        if (!hasDonatedRef.current) {
          trackSevaEvent("checkout_abandoned", {
            last_step_reached: stepNameOf(maxStepRef.current),
            interacted: hasInteractedRef.current,
            donation_type: donationTypeOf(lastFrequencyRef.current),
          });
        }
      };
      // The frequency is read through `lastFrequencyRef`, which always holds the
      // current value, so changing it cannot re-run this effect — that would
      // close the visit and open a new one in the middle of it.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const handleAmountSelect = (amount, isOther = false) => {
    setIsOtherSelected(isOther);
    if (!isOther) {
      setSelectedAmount(amount);
      setCustomAmount("");
      // Leaving "Other" unmounts the hidden input, and an unmounting TextInput
      // does not reliably fire onBlur — so clear this by hand. Left stale-true,
      // re-entering "Other" would show the caret a beat before the field was
      // actually focused, which is the thing the caret is supposed to mean.
      setIsAmountFocused(false);
    }
    hasInteractedRef.current = true;
    markStep("amount_selected");
    trackSevaEvent("amount_selected", {
      is_custom: isOther,
      amount_bucket: isOther ? "custom" : bucketAmount(amount),
      donation_type: donationTypeOf(frequency),
    });
  };

  const handleCustomAmountChange = (val) => {
    // Only numeric input, at most fifteen digits. Past that the figure stops
    // being exact in a JS number and the display fell into exponent form —
    // "1e+39" where an amount should be. Fifteen digits is the last length
    // that stays exact, and no real donation gets anywhere near it.
    const cleaned = val.replace(/[^0-9]/g, "").slice(0, 15);
    setCustomAmount(cleaned);
  };

  // The input's `autoFocus` prop only reliably fires on its very first mount —
  // after leaving this screen and coming back (tab screens stay frozen, not
  // unmounted, so the input isn't remounting) it silently no-ops and the
  // cursor never reappears when "Other" is re-selected. Focus explicitly
  // instead, every time isOtherSelected turns true, with a brief delay so the
  // native view is ready to accept it.
  useEffect(() => {
    if (!isOtherSelected) return undefined;
    const timer = setTimeout(() => otherAmountInputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [isOtherSelected]);

  // Re-open the keyboard when the amount is tapped while already in "Other".
  // The effect above only fires on the false→true switch, so after the user
  // dismisses the keyboard (e.g. hardware back) without leaving "Other",
  // nothing re-focuses the input. On Android the TextInput can also keep RN
  // focus after a keyboard dismiss, making a plain focus() a no-op — so blur
  // first, then focus, to force the keyboard to reappear.
  const focusOtherAmount = () => {
    const input = otherAmountInputRef.current;
    if (!input) return;
    input.blur();
    setTimeout(() => otherAmountInputRef.current?.focus(), 50);
  };

  // Tapping the figure is how people expect to edit it, so it switches to
  // "Other" itself rather than doing nothing until the Other chip is pressed.
  // Selecting Other flips isOtherSelected, and the effect above focuses the
  // input; when already in Other there is no state change to trigger it, so
  // refocus directly.
  const handleAmountPress = () => {
    if (isOtherSelected) {
      focusOtherAmount();
      return;
    }
    handleAmountSelect(null, true);
  };

  const handleFrequencyChange = (freq) => {
    // Both options stay pressable, so the selected one can be tapped again. That
    // is still an interaction with the donation type, but nothing CHANGED — and
    // an event named frequency_changed reporting the value it already held makes
    // the switch look busier than it is.
    const changed = freq !== frequency;
    setFrequency(freq);
    lastFrequencyRef.current = freq;
    hasInteractedRef.current = true;
    markStep("donation_type_selected");
    if (!changed) return;
    trackSevaEvent("frequency_changed", {
      frequency: freq,
      donation_type: donationTypeOf(freq),
    });
  };

  const effectiveDonationType = donationTypeOf(frequency);

  // ─── The one definition of "is there an amount to donate" ──────────────────
  // The Donate button's disabled state and handleDonate both read `canDonate`,
  // so the button can never say one thing while the tap does another.
  //
  // `localAmount` is in the DONOR's currency (the typed figure in "Other" mode,
  // else the selected preset tier); `donationUsd` is what Qgiv is prefilled
  // with, because Qgiv charges USD. localToUsd returns 0 for ""/"0"/non-numeric
  // and floors a real amount at $1, so `> 0` is an exact test for "the donor
  // has chosen something" with no second threshold to keep in sync.
  const localAmount = isOtherSelected ? customAmount : selectedAmount;
  const donationUsd = localToUsd(localAmount, currency);
  const canDonate = donationUsd > 0;

  // Below this, the hand-off would charge MORE than the donor typed. Qgiv takes
  // whole US dollars with a $1 minimum of its own, and localToUsd floors at $1,
  // so ₹1 arrived at Qgiv as $1 — about ₹96.
  const minLocal = minLocalAmount(currency);
  const belowMinimum = Number(localAmount) > 0 && Number(localAmount) < minLocal;
  // "Not ready to donate" is one state whether the box is empty or the figure
  // is under the floor, and the button shows it the same way for both. The
  // button used to stay live under the floor and refuse the tap, which made
  // sense while the reason only appeared AFTER the tap; the reason is live
  // under the amount now, so a live button that did nothing just read as
  // broken. Both the button's disabled state and the handler's guard read this
  // one flag, so they cannot disagree.
  const donateEnabled = canDonate && !belowMinimum;
  // One message, shown inline under the amount (see renderDonateWidget) and
  // announced again on a refused tap for a screen reader that is not on the
  // amount field.
  const minAmountMessage = STRINGS.formatString(STRINGS.SEVA_MIN_AMOUNT, {
    amount: formatCurrency(minLocal, currency),
  });
  // A donor who typed an amount and hit the floor is not a donor who lost
  // interest, but the visit ends the same way for both — at amount_selected —
  // so without its own event this is invisible. Recorded when the floor is
  // hit rather than on a tap, since the button no longer takes one: it fires
  // once per crossing, not per keystroke. `currency` is the dimension that
  // matters — the floor is a per-currency consequence of Qgiv charging whole
  // US dollars, so this is where a too-high floor shows up.
  useEffect(() => {
    if (!belowMinimum) return;
    trackSevaEvent("below_minimum", {
      // The CODE, not the currency object — Firebase stringifies whatever it
      // is given, and an object arrives as a useless "[object Object]".
      currency: currency.code,
      amount_bucket: bucketAmount(donationUsd),
      donation_type: effectiveDonationType,
    });
    // Only the crossing matters; the other values are read as of that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [belowMinimum]);

  // ─── Shared browser helper ─────────────────────────────────────────────────
  const openBrowserForUrl = useCallback(
    async (url) => {
      if (isBrowserOpenRef.current) return;

      const barColor = c.surface;
      const controlColor = c.textPrimary;

      isBrowserOpenRef.current = true;
      try {
        await openInAppBrowser(url, { barColor, controlColor });
      } finally {
        isBrowserOpenRef.current = false;
      }
    },
    [isDarkMode, theme]
  );

  // There used to be an AppState listener here that re-opened the browser
  // whenever the app came back to the foreground. It is what made the donation
  // page "lose progress" on an app switch: the Custom Tab was still there,
  // holding the half-filled Qgiv form, and this relaunched the URL over the top
  // of it 300ms after the user returned.
  //
  // It was a workaround for the library adding FLAG_ACTIVITY_NO_HISTORY to the
  // tab, which really did destroy it on backgrounding — but that is fixed at
  // source now, by `showInRecents: true` in common/inAppBrowser. The workaround
  // outlived the bug and became the bug.

  const handleDonate = useCallback(async () => {
    // Guarded twice on purpose — the button is disabled AND the handler refuses,
    // so no future caller can reach the hand-off without an amount.
    //
    // There used to be a `finalAmount = 10` fallback here for an empty or zero
    // amount. It meant an empty box opened Qgiv prefilled with $10 the donor had
    // never chosen — and in a raw US dollar figure that a non-USD donor was
    // never shown. A donor must only ever be handed a figure they picked.
    // `donationUsd` is derived above and is what the button gates on.
    if (!donateEnabled) return;

    // A tap that cannot reach Qgiv must not enter the funnel. `openBrowserForUrl`
    // refuses while a tab is already open — it is shared with the content links
    // on this screen — and it is reached without awaiting, so a refused tap used
    // to emit payment_started AND payment_success for a browser that never
    // opened. payment_success is the conversion proxy the whole funnel is read
    // on, so every fast double-tap on Donate booked a second donation.
    // A tap that cannot reach Qgiv must not enter the funnel. `openBrowserForUrl`
    // refuses while a tab is already open — it is shared with the content links
    // on this screen — and it is reached without awaiting, so a refused tap used
    // to emit payment_started AND payment_success for a browser that never
    // opened. payment_success is the conversion proxy the whole funnel is read
    // on, so every fast double-tap on Donate booked a second donation.
    if (isBrowserOpenRef.current) return;

    hasDonatedRef.current = true;
    markStep("payment_started");
    // Last in-app observable step: the Donate tap hands off to Qgiv. This is
    // payment INTENT, not a confirmed donation — Qgiv holds payment truth and
    // the app cannot see it. Every param here is a real, non-empty value.
    // amount_bucket stays USD-based so the analytics funnel is comparable
    // across regions regardless of the displayed currency.
    trackSevaEvent("payment_started", {
      provider: "qgiv",
      is_custom: isOtherSelected,
      amount_bucket: bucketAmount(donationUsd),
      donation_type: effectiveDonationType,
    });

    const url = buildQgivUrl({
      amount: donationUsd,
      isCustomAmount: isOtherSelected,
      donationType: effectiveDonationType,
      frequency,
    });

    // One payment surface on both platforms: the in-app browser, exactly as
    // every other outbound link in the app uses it.
    //
    // Android used to get an in-process WebView instead, on the theory that the
    // OS killed the RN process whenever a Chrome Custom Tab ran on top of it and
    // took the donation page with it. That is not what was happening. Six other
    // call sites — the Hukamnama link, Ask Khalis, the Explore tiles, Random
    // Shabad, the audio request form — open the same Custom Tab through the same
    // helper, and every one of them survives an app switch and comes back where
    // the user left it. What made Qgiv alone lose its place was this screen's
    // own resume handler, which re-opened the URL each time the app returned to
    // the foreground and so restarted the payment page from the top. It is gone.
    //
    // Launched without awaiting, so payment_success below still fires at the
    // moment of hand-off rather than when the browser closes.
    openBrowserForUrl(url);

    // Qgiv handoff opened — counted as a successful donation per product
    // decision (the app cannot observe Qgiv's real confirmation). Fired at the
    // same point on both platforms. Params are always real, non-empty values.
    trackSevaEvent("payment_success", {
      provider: "qgiv",
      amount_bucket: bucketAmount(donationUsd),
      donation_type: effectiveDonationType,
    });
  }, [
    donateEnabled,
    currency,
    donationUsd,
    isOtherSelected,
    effectiveDonationType,
    frequency,
    openBrowserForUrl,
    markStep,
  ]);

  const content = config?.content ?? {};

  // Tax messaging differs by donor country: US donations are tax-deductible;
  // donations from outside the US are not. Country comes from the backend Seva
  // config (defaults to "US" when unknown). BUT when offline with nothing ever
  // cached (source === "fallback"), the country is a pure guess — so we show NO
  // tax note at all rather than a possibly-wrong US-specific claim (SIO-155).
  const isOfflineFallback = config?.source === "fallback";
  const isUSDonor = (config?.country ?? "US").toUpperCase() === "US";
  let taxMessage = null;
  if (!isOfflineFallback) {
    taxMessage = isUSDonor ? content.taxMessage : content.nonUsTaxMessage;
  }

  // One "Other ways to do Seva" row, from a server `seva-means:<page>` link
  // block. The backend supplies the title (link text) + subtitle (trailing
  // text) + which page; the app supplies the icon, accent tint, and the native
  // navigation to the SDUI page — the only non-content pieces.
  //
  // A row may also carry `?open=<encoded url>`. That means "open this URL in
  // the in-app browser instead of navigating", for rows whose sub-page would
  // hold a single link. The page key before the `?` still drives the icon.
  const renderMeansItem = (block, key) => {
    const linkSeg = block.segments.find((s) => s.link);
    const subSeg = block.segments.find((s) => !s.link && s.text.trim());
    const title = linkSeg ? linkSeg.text : blockText(block);
    const sub = subSeg ? subSeg.text.trim() : "";
    const target =
      linkSeg && linkSeg.url && linkSeg.url.startsWith("seva-means:")
        ? linkSeg.url.slice("seva-means:".length)
        : null;
    const [page, query] = target ? target.split("?") : [null, ""];
    const openMatch = query && query.match(/(?:^|&)open=([^&]*)/);
    let openUrl = null;
    if (openMatch) {
      try {
        openUrl = decodeURIComponent(openMatch[1]);
      } catch {
        openUrl = null;
      }
    }
    const meta = MEANS_META[page] || MEANS_META.other;
    const { Icon } = meta;
    const meansTint = palette.meansTints[page] || palette.meansTints.other;
    const trailingIconColor = c.textSecondary;
    return (
      <Pressable
        key={key}
        style={styles.meansRow}
        onPress={() => {
          if (openUrl) openBrowserForUrl(openUrl);
          else if (page) navigation.navigate("SevaMeans", { page });
        }}
        accessibilityRole={openUrl ? "link" : "button"}
        accessibilityLabel={`seva-means-${page}`}
      >
        {/* The disc behind the icon is the same hue at 13% opacity. */}
        <View style={[styles.meansIconCircle, { backgroundColor: `${meansTint}22` }]}>
          <Icon size={20} color={meansTint} />
        </View>
        <View style={styles.meansTextWrap}>
          <CustomText style={styles.meansTitle}>{title}</CustomText>
          {!!sub && <CustomText style={styles.meansSub}>{sub}</CustomText>}
        </View>
        {/* Chevron means "another screen in the app"; the external-link mark
            means "this leaves the app for a browser". */}
        {openUrl ? (
          <ExternalLinkIcon size={19} color={trailingIconColor} />
        ) : (
          <ChevronRight size={20} color={trailingIconColor} />
        )}
      </Pressable>
    );
  };

  // Renders one server-driven `{type:"html"}` segment as native elements, using
  // the backend's class hints to pick the matching style/component. NOT a
  // WebView — native layout keeps the page's own ScrollView the single scroll
  // surface, and light/dark theming stays app-owned.
  const renderHtmlSegment = (html, keyPrefix) =>
    parseHtmlBlocks(html).map((block, i) => {
      const key = `${keyPrefix}-block-${i}`;
      const cls = block.className || "";

      if (cls.includes("seva-means")) return renderMeansItem(block, key);

      if (cls.includes("seva-hero-title")) {
        return (
          <CustomText key={key} style={styles.heroTitle}>
            {blockText(block)}
          </CustomText>
        );
      }
      if (cls.includes("seva-section")) {
        return (
          <CustomText key={key} style={styles.sectionHeader}>
            {blockText(block)}
          </CustomText>
        );
      }
      if (cls.includes("seva-card-title")) {
        return (
          <CustomText key={key} style={styles.cardTitle}>
            {blockText(block)}
          </CustomText>
        );
      }
      if (cls.includes("seva-card-sub")) {
        return (
          <CustomText key={key} style={styles.cardSub}>
            {blockText(block)}
          </CustomText>
        );
      }
      // Plain (unclassed) headings → section-header style.
      if (block.tag === "h1" || block.tag === "h2" || block.tag === "h3") {
        return (
          <CustomText key={key} style={styles.sectionHeader}>
            {blockText(block)}
          </CustomText>
        );
      }

      const isFooter = cls.includes("seva-footer");
      let blockStyle = styles.description;
      if (cls.includes("seva-hero-desc")) blockStyle = styles.heroDesc;
      else if (isFooter) blockStyle = styles.footerText;
      return (
        <Text key={key} style={blockStyle}>
          {block.segments.map((seg, j) =>
            seg.link ? (
              <Text
                // eslint-disable-next-line react/no-array-index-key
                key={j}
                style={isFooter ? blockStyle : styles.link}
                onPress={() => openBrowserForUrl(seg.url)}
              >
                {seg.text}
              </Text>
            ) : (
              // eslint-disable-next-line react/no-array-index-key
              <Text key={j}>{seg.text}</Text>
            )
          )}
        </Text>
      );
    });

  const FREQUENCY_LABELS = {
    Monthly: STRINGS.SEVA_MONTHLY,
    Annually: STRINGS.SEVA_ANNUALLY,
    "One Time": STRINGS.SEVA_ONE_TIME,
  };

  const getFrequencyLabel = () =>
    frequency === "Annually" ? STRINGS.SEVA_PER_YEAR : STRINGS.SEVA_PER_MONTH;

  // The big figure in the card. A custom ("Other") amount is typed in the local
  // currency, so it's shown as-is; a selected preset is a USD base tier shown as
  // its localised, grouped display figure (e.g. $10 → "1,000" for ₹). The
  // currency symbol is rendered separately alongside it.
  const displayAmount = formatNumber(
    isOtherSelected && customAmount ? customAmount : selectedAmount ?? 0
  );

  // Preset tiers, in the LOCAL currency, resolved in priority order: a backend
  // per-currency override (config.amountPresets[code]), else the currency's own
  // round ladder (INR → ₹100 / ₹1,000 / ₹5,000), else the backend USD base
  // amounts × rate. selectedAmount + customAmount are LOCAL; both convert to USD
  // only at donate time (Qgiv charges USD).
  const amounts = resolveLocalPresets(currency, config?.amounts, config?.amountPresets);

  // Extracted so they can render at their `<!--SLOT:donate_widget-->`
  // / `<!--SLOT:tax_note-->` position within server-driven content — or, when
  // there's no backend content yet, at their fixed native-fallback position
  // below. All handlers/state stay exactly as before; only the position is
  // now dynamic.
  const renderDonateWidget = () => (
    <>
      {/* Amount card — static display OR inline input when Other is selected.
          The whole card is the tap target so the keyboard opens from anywhere
          on it, not just the thin cursor line. */}
      <Pressable
        style={({ pressed }) => [styles.amountCard, pressed && styles.amountCardPressed]}
        onPress={handleAmountPress}
        accessibilityRole="button"
        accessibilityLabel={STRINGS.SEVA_OTHER}
      >
        <View style={styles.amountContainer}>
          <View style={styles.amountRow}>
            {/* The figure is ONE inline Text: the currency symbol (its own font —
                system for ₹, Baloo for the rest), the digits (always Baloo), a
                blinking cursor while editing, and the inline "/month" — all as
                spans, so they share ONE text baseline and always align, whatever
                the symbol's font. In "Other" mode the digits come from state fed
                by a hidden TextInput (below) that captures the keystrokes. */}
            <CustomText
              style={[
                styles.amountDisplay,
                { fontSize: amountFontSize, lineHeight: amountLineHeight },
              ]}
              numberOfLines={1}
            >
              {/* The gap after the symbol is a real space in the run, NOT
                  `letterSpacing: 8` as it used to be. Trailing letter-spacing is
                  not counted when the run is measured, so Android built the line
                  8dp narrower than it then drew: on a tablet in landscape the
                  figure came out as "₹10…", with the whole "/month" span eaten,
                  and with the line cap lifted it wrapped instead of ellipsing.
                  A space is a glyph, so it is measured like every other one. */}
              <Text
                style={{
                  fontFamily: symbolFontFamily,
                  fontSize: symbolFontSize,
                }}
              >
                {`${currency.symbol} `}
              </Text>
              {isOtherSelected && customAmount === "" ? (
                <Text style={styles.amountPlaceholder}>0</Text>
              ) : (
                displayAmount
              )}
              {/* Gated on REAL focus, not on "Other is selected" — so the caret
                  disappears with the keyboard when the field is tapped out of,
                  instead of sitting there on a field that takes no keystrokes.
                  Absent rather than merely still: a motionless caret is exactly
                  what made the old state unreadable. */}
              {isOtherSelected && isAmountFocused && (
                <BlinkingCursor color={c.textPrimary} fontSize={amountFontSize} />
              )}
              {frequency !== "One Time" && (
                <Text style={styles.perMonthSpan}>{` /${getFrequencyLabel()}`}</Text>
              )}
            </CustomText>
            {isOtherSelected && (
              <TextInput
                ref={otherAmountInputRef}
                style={styles.hiddenInput}
                value={customAmount}
                onChangeText={handleCustomAmountChange}
                // The only source of truth for whether this field is live. The
                // effect above focuses it whenever Other is selected, so the
                // caret still appears the moment the amount card is tapped.
                onFocus={() => setIsAmountFocused(true)}
                onBlur={() => setIsAmountFocused(false)}
                keyboardType="numeric"
                caretHidden
              />
            )}
          </View>
        </View>
      </Pressable>

      {/* The minimum is said HERE, under the figure the donor is typing, not in
          a bottom toast: the keyboard is up for the whole of that typing and a
          bottom toast renders behind it, so the donor only saw a Donate tap
          that appeared to do nothing. Live rather than tap-triggered — it
          clears itself the moment the amount reaches the floor. */}
      {belowMinimum && (
        <CustomText style={styles.minAmountNotice} accessibilityLiveRegion="polite">
          {minAmountMessage}
        </CustomText>
      )}

      {/* Preset amounts */}
      <View style={styles.amountButtons}>
        {amounts.map((amount) => (
          <Pressable
            key={amount}
            style={[
              styles.amountButton,
              selectedAmount === amount && !isOtherSelected && styles.amountButtonSelected,
            ]}
            onPress={() => handleAmountSelect(amount)}
          >
            <CustomText
              style={[
                styles.amountButtonText,
                selectedAmount === amount && !isOtherSelected && styles.amountButtonTextSelected,
              ]}
              numberOfLines={2}
            >
              {/* Symbol span (own font) + Baloo digits — inline, baseline-aligned.
                  `amount` is already the LOCAL figure. */}
              <Text style={{ fontFamily: symbolFontFamily }}>{currency.symbol}</Text>
              {formatNumber(amount)}
            </CustomText>
          </Pressable>
        ))}
        <Pressable
          style={[styles.amountButton, isOtherSelected && styles.amountButtonSelected]}
          onPress={() => handleAmountSelect(null, true)}
        >
          {/* "Other" is the longest label and the one that used to wrap onto
              its own line on narrow screens — shrink-to-fit keeps the row
              intact in every locale. */}
          <CustomText
            style={[styles.amountButtonText, isOtherSelected && styles.amountButtonTextSelected]}
            numberOfLines={2}
          >
            {STRINGS.SEVA_OTHER}
          </CustomText>
        </Pressable>
      </View>

      {/* Frequency / donation type — one segmented control, not two loose
          radios. Announced as a radio group so a screen reader reads it as the
          single either-or choice it is, and each half states whether it is the
          chosen one; before this neither carried a role at all. */}
      <View
        style={[styles.frequencyContainer, stackFrequency && styles.frequencyContainerStacked]}
        accessibilityRole="radiogroup"
      >
        {["Monthly", "One Time"].map((freq, index) => {
          const selected = frequency === freq;
          return (
            <React.Fragment key={freq}>
              {index > 0 && (
                <View
                  style={stackFrequency ? styles.frequencyDividerStacked : styles.frequencyDivider}
                />
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.frequencyOption,
                  pressed && styles.frequencyOptionPressed,
                ]}
                onPress={() => handleFrequencyChange(freq)}
                accessibilityRole="radio"
                accessibilityState={{ selected, checked: selected }}
                accessibilityLabel={FREQUENCY_LABELS[freq]}
              >
                <View
                  style={[styles.radioRing, selected ? styles.radioRingOn : styles.radioRingOff]}
                >
                  {selected && <View style={styles.radioDot} />}
                </View>
                <CustomText style={[styles.frequencyText, selected && styles.frequencyTextOn]}>
                  {FREQUENCY_LABELS[freq]}
                </CustomText>
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>

      {/* Donate button. Inert until there is an amount worth handing over: an
          empty box (it used to open Qgiv at a substituted $10) or a figure
          under the floor, whose reason sits live above this. */}
      <Pressable
        style={styles.donateButton}
        onPress={handleDonate}
        disabled={!donateEnabled}
        accessibilityRole="button"
        accessibilityLabel={STRINGS.donate}
        accessibilityState={{ disabled: !donateEnabled }}
      >
        <LinearGradient
          // Disabled FLATTENS the fill rather than fading it under an opacity,
          // so the label keeps its own contrast — the same treatment the shared
          // ui/Button gives a disabled primary. LinearGradient needs two stops,
          // hence the repeated colour.
          colors={
            donateEnabled
              ? [c.controlAccent, c.controlAccentPressed]
              : [c.surfaceSelected, c.surfaceSelected]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            borderRadius: 100,
            paddingHorizontal: 18,
            paddingVertical: 14,
          }}
        >
          <DonateIcon size={30} color={canDonate ? c.onControlAccent : c.textDisabled} />
          <CustomText
            style={[styles.donateButtonText, !canDonate && styles.donateButtonTextDisabled]}
          >
            {STRINGS.donate}
          </CustomText>
        </LinearGradient>
      </Pressable>
    </>
  );

  // Tax note — depends on the donor's country (US = tax-deductible). Always
  // native/country-conditional, both here and in server-driven content (see
  // the tax_note slot below) — raw backend HTML text cannot express this.
  const renderTaxNote = () =>
    taxMessage ? <CustomText style={styles.taxNote}>{taxMessage}</CustomText> : null;

  // Server-driven content, split into an ordered sequence of HTML
  // fragments + native slots by parseSevaContent (see services/sevaConfig.js).
  // sevaConfig.js always falls back to its own bundled default content when
  // there's no real backend content yet, so this is effectively never empty
  // in practice — the native STRINGS-driven rendering below only exists as a
  // defensive safety net in case parseSevaContent ever legitimately returns [].
  const segments = config?.content?.segments ?? [];

  const renderSlot = (name, key) => {
    if (name === "donate_widget") {
      return <React.Fragment key={key}>{renderDonateWidget()}</React.Fragment>;
    }
    if (name === "tax_note") return <React.Fragment key={key}>{renderTaxNote()}</React.Fragment>;
    return null;
  };

  // The "donate" card group: a bordered card with an icon header built from the
  // server card-title/card-sub, then the native donate widget + tax note the
  // group contains (positioned by the backend via slots).
  const renderDonateCard = (childSegments, key) => {
    let cardTitle = "";
    let cardSub = "";
    const slots = [];
    childSegments.forEach((seg) => {
      if (seg.type === "html") {
        parseHtmlBlocks(seg.value).forEach((block) => {
          const cls = block.className || "";
          if (cls.includes("seva-card-title")) cardTitle = blockText(block);
          else if (cls.includes("seva-card-sub")) cardSub = blockText(block);
        });
      } else if (seg.type === "slot") {
        slots.push(seg.name);
      }
    });
    return (
      <View key={key} style={styles.donateCard}>
        {/* Card header (icon + title/sub) renders only when the server content
            actually provides a title or subtitle. When both are dropped, the
            card starts straight at the donate widget — no lone floating icon. */}
        {(!!cardTitle || !!cardSub) && (
          <View style={styles.donateCardHeader}>
            <View style={styles.cardIconCircle}>
              <HandHeartIcon size={22} color={c.accent} />
            </View>
            <View style={styles.donateCardHeaderText}>
              {!!cardTitle && <CustomText style={styles.cardTitle}>{cardTitle}</CustomText>}
              {!!cardSub && <CustomText style={styles.cardSub}>{cardSub}</CustomText>}
            </View>
          </View>
        )}
        {slots.map((name, idx) => renderSlot(name, `${key}-slot-${idx}`))}
      </View>
    );
  };

  // Renders the full server-driven segment list as the flat page layout,
  // grouping <!--CARD:...-->…<!--/CARD--> into a card. Server + bundled default
  // are effectively never empty, so the empty case is only a safety net.
  const renderSegments = () => {
    if (!segments.length) {
      return (
        <View style={styles.donateCard}>
          {renderDonateWidget()}
          {renderTaxNote()}
        </View>
      );
    }
    const out = [];
    let i = 0;
    while (i < segments.length) {
      const seg = segments[i];
      if (seg.type === "card_open") {
        const children = [];
        i += 1;
        while (i < segments.length && segments[i].type !== "card_close") {
          children.push(segments[i]);
          i += 1;
        }
        if (i < segments.length) i += 1; // skip card_close
        out.push(renderDonateCard(children, `card-${out.length}`));
      } else if (seg.type === "html") {
        out.push(
          <React.Fragment key={`seg-${i}`}>
            {renderHtmlSegment(seg.value, `seg-${i}`)}
          </React.Fragment>
        );
        i += 1;
      } else if (seg.type === "slot") {
        out.push(renderSlot(seg.name, `seg-${i}`));
        i += 1;
      } else {
        i += 1; // stray card_close → skip
      }
    }
    return out;
  };

  // Regular app bar (SIO-155): plain title + a close (✕) button top-right that
  // returns to Home / All Banis. Replaces the old in-page "ਸੁੰਦਰ ਗੁਟਕਾ" heading.
  // The bar background matches the page BODY (dark navy / cream) so there's no
  // contrasting black strip above the divider.
  // Matches the dashboard's ground rather than the old cream. The foreground
  // drives BOTH the "Seva" title and the close cross: near-black read as a
  // heavy, unbranded mark against the light bar, so it is the brand navy.
  const headerBg = c.backgroundAlt;
  // The one header foreground — brand navy in light, white in dark. Drives both
  // the "Seva" title and the close cross. `textPrimary`'s near-black read as a
  // heavy, unbranded mark against the light bar.
  const { headerFg } = c;
  // The shared header, like every other screen. This used to be `AppBar`, a
  // second header component that duplicated ScreenHeader and drifted from it —
  // it padded by the raw safe-area inset and stood its row at 52 instead of 56,
  // so the Seva title and the divider under it sat lower than everywhere else.
  //
  // The title size comes from the `title` type role rather than a hand-set 26.
  const renderHeader = () => (
    <ScreenHeader
      title={STRINGS.SEVA}
      surface={headerBg}
      titleVariant="title"
      showBorder={false}
      actions={
        <Pressable
          onPress={() => navigation.navigate("Home")}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={STRINGS.CLOSE}
        >
          {/* Same size as the Dashboard's close cross, so the two read as one
              control rather than two. */}
          <CloseIcon size={theme.layout.header.closeIconSize} color={headerFg} />
        </Pressable>
      }
    />
  );

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeArea backgroundColor={headerBg}>
        <StatusBarComponent backgroundColor={headerBg} />
        {renderHeader()}
        <GradientDivider />
        <View style={styles.centered}>
          <Spinner size="large" color={theme.c.accent} />
        </View>
      </SafeArea>
    );
  }

  // ─── Error / offline ──────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeArea backgroundColor={headerBg}>
        <StatusBarComponent backgroundColor={headerBg} />
        {renderHeader()}
        <GradientDivider />
        <View style={styles.centered}>
          <CustomText style={styles.description}>{STRINGS.SEVA_LOAD_ERROR}</CustomText>
          <Pressable onPress={() => Linking.openURL("https://khalisfoundation.org/donate")}>
            <CustomText style={[styles.description, { color: theme.c.textBrand }]}>
              {STRINGS.SEVA_DONATE_DIRECTLY}
            </CustomText>
          </Pressable>
        </View>
      </SafeArea>
    );
  }

  // ─── Main screen ──────────────────────────────────────────────────────────
  return (
    <SafeArea backgroundColor={headerBg}>
      <StatusBarComponent backgroundColor={headerBg} />
      {renderHeader()}
      <GradientDivider />
      {/* The app's themed scrollbar, the same one the bani list and Settings
          draw — the native bar cannot follow a designed theme. Indicator is a
          SIBLING inside a flex:1 wrapper, as the hook requires. */}
      <View style={{ flex: 1 }}>
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...scrollViewProps}
        >
          <View
            style={[
              styles.container,
              {
                paddingHorizontal: hPad,
                // Tighter top padding — the AppBar + divider already separate
                // the hero from the top, so the hero ("Support our mission")
                // sits close.
                paddingTop: Math.round(vPad * 0.4),
                paddingBottom: vPad,
                gap,
              },
            ]}
          >
            {renderSegments()}
          </View>
        </Animated.ScrollView>
        {Indicator}
      </View>
    </SafeArea>
  );
};

SevaScreen.propTypes = {
  // Only the one method this screen calls; PropTypes.object is forbidden and
  // describes nothing anyway.
  navigation: PropTypes.shape({ navigate: PropTypes.func }),
};

export default SevaScreen;
